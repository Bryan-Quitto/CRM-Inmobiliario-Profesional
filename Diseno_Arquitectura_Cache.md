# Diseño Técnico (Design): Arquitectura Multi-Tenant Cache V2 (Enterprise Grade)

Este documento define la estructura de clases, esquemas de base de datos y mecanismos de infraestructura en .NET 10 y Supabase (PostgreSQL) para implementar la arquitectura de caché BYOK de proveedor dual (OpenAI / Gemini 2.5), integrando alta concurrencia y resiliencia en sistemas distribuidos.

---

## 1. Configuración de EF Core y SQL (Persistencia de Estado)

Para asegurar la sincronización correcta entre la base de datos PostgreSQL (Supabase) y Entity Framework Core, se utilizará SQL manual para la migración de base de datos.

### Script SQL Manual (Supabase SQL Editor)
```sql
-- Agregar columnas de rastreo de caché a la tabla Agents
ALTER TABLE public."Agents" 
ADD COLUMN gemini_cache_id VARCHAR(255) NULL,
ADD COLUMN gemini_cache_expires_at timestamptz NULL,
ADD COLUMN byok_key_status VARCHAR(50) DEFAULT 'Valid' NOT NULL;

-- Índice para búsquedas rápidas durante el loop de renovación (Background Service)
CREATE INDEX idx_agents_cache_expiry ON public."Agents"(gemini_cache_expires_at) 
WHERE byok_key_status = 'Valid';
```

### Configuración Fluent API en C# (EF Core)
Ubicación: `/Features/Agents/Infrastructure/AgentConfiguration.cs`

```csharp
public void Configure(EntityTypeBuilder<Agent> builder)
{
    // Mapeo Estricto Mandatorio
    builder.HasKey(a => a.Id); // Guid nativo

    builder.Property(a => a.GeminiCacheId)
           .HasColumnName("gemini_cache_id")
           .HasMaxLength(255)
           .IsRequired(false);

    // Mapeo de timestamptz a DateTimeOffset para prevenir desajustes de Zona Horaria
    builder.Property(a => a.GeminiCacheExpiresAt)
           .HasColumnName("gemini_cache_expires_at")
           .HasColumnType("timestamp with time zone")
           .IsRequired(false);

    builder.Property(a => a.ByokKeyStatus)
           .HasColumnName("byok_key_status")
           .HasMaxLength(50)
           .HasDefaultValue("Valid")
           .IsRequired();
}
```

---

## 2. Implementación del Interceptor BYOK (Circuit Breaker)

Se utilizará un `DelegatingHandler` inyectado en el `HttpClient`. Para transmitir el `AgentId` de manera segura desde la lógica de negocio hasta este interceptor de infraestructura, se utilizará `HttpRequestOptions`.

### Pase seguro del AgentId (HttpRequestOptions)
```csharp
// Definición global de la llave (Constantes)
public static readonly HttpRequestOptionsKey<Guid> AgentIdOptionKey = new("ByokAgentId");

// En el servicio de aplicación que realiza la llamada:
var requestMessage = new HttpRequestMessage(HttpMethod.Post, "...");
requestMessage.Options.Set(AgentIdOptionKey, currentAgentId);
```

### Clase Interceptora
Ubicación: `/Features/AI/Infrastructure/Handlers/ByokCircuitBreakerHandler.cs`

```csharp
public class ByokCircuitBreakerHandler : DelegatingHandler
{
    private readonly IAgentStateService _agentStateService;
    private readonly ILogger<ByokCircuitBreakerHandler> _logger;

    public ByokCircuitBreakerHandler(IAgentStateService agentStateService, ILogger<ByokCircuitBreakerHandler> logger)
    {
        _agentStateService = agentStateService;
        _logger = logger;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = await base.SendAsync(request, cancellationToken);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized || 
            response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            if (request.Options.TryGetValue(Constants.AgentIdOptionKey, out Guid agentId))
            {
                _logger.LogWarning("Fallo de facturación/autenticación detectado. Invalidando llave BYOK para Agente: {AgentId}", agentId);
                
                // Marca la llave como 'Invalid' en Supabase y dispara un CancellationTokenSource interno 
                await _agentStateService.InvalidateAgentKeyAsync(agentId, cancellationToken);
            }
            else
            {
                _logger.LogError("Fallo auth, pero AgentId no fue provisto en HttpRequestOptions.");
            }
        }

        return response;
    }
}
```

---

## 3. Manejo Concurrente del Bucle de Renovación (Thundering Herd)

Para evitar colisiones cuando múltiples contenedores se levantan, la consulta SQL utilizará la cláusula de PostgreSQL `FOR UPDATE SKIP LOCKED`, actuando como una cola distribuida atómica nativa.

### Lógica Transaccional Estricta (ProcessRenewalsAsync)
Ubicación: `/Features/AI/Services/CacheRenewalProcessor.cs`

```csharp
public async Task ProcessRenewalsAsync(CancellationToken cancellationToken)
{
    // 1. Abrir conexión y transacción manual obligatoria
    await _dbConnection.OpenAsync(cancellationToken);
    using var transaction = await _dbConnection.BeginTransactionAsync(cancellationToken);

    try
    {
        // 2. Extraer y bloquear las filas EN LA MISMA TRANSACCIÓN
        string selectSql = @"
            SELECT ""Id"", ""gemini_cache_id"", ""gemini_cache_expires_at"", ""ApiKey""
            FROM public.""Agents""
            WHERE ""byok_key_status"" = 'Valid'
              AND ""gemini_cache_expires_at"" < NOW() + INTERVAL '10 minutes'
            FOR UPDATE SKIP LOCKED
            LIMIT 50;";
            
        var agentsToRenew = (await _dbConnection.QueryAsync<Agent>(
            selectSql, transaction: transaction)).ToList();

        if (!agentsToRenew.Any()) return;

        // 3. Procesar las peticiones a Gemini
        foreach (var agent in agentsToRenew)
        {
            var success = await _geminiApiClient.PatchTtlAsync(agent.GeminiCacheId, agent.ApiKey, cancellationToken);
            
            if (success)
            {
                // 4. Actualizar la base de datos para ese agente
                string updateSql = @"
                    UPDATE public.""Agents""
                    SET ""gemini_cache_expires_at"" = NOW() + INTERVAL '1 hour'
                    WHERE ""Id"" = @Id;";
                    
                await _dbConnection.ExecuteAsync(updateSql, new { Id = agent.Id }, transaction: transaction);
            }
        }

        // 5. Liberar los bloqueos confirmando la transacción
        await transaction.CommitAsync(cancellationToken);
    }
    catch
    {
        await transaction.RollbackAsync(cancellationToken);
        throw;
    }
}
```

### La Carga Útil Exacta del PATCH de Gemini
La renovación de TTL enviará **obligatoriamente** el parámetro de query `updateMask=ttl`. Ubicación: `GeminiApiClient.cs`
```csharp
public async Task<bool> PatchTtlAsync(string geminiCacheId, string byokKey, CancellationToken cancellationToken)
{
    var patchPayload = new { ttl = "3600s" };
    var jsonContent = JsonContent.Create(patchPayload);

    var request = new HttpRequestMessage(HttpMethod.Patch, 
        $"https://generativelanguage.googleapis.com/v1beta/{geminiCacheId}?updateMask=ttl");

    request.Headers.Add("x-goog-api-key", byokKey);
    request.Content = jsonContent;

    var response = await _httpClient.SendAsync(request, cancellationToken);
    return response.IsSuccessStatusCode;
}
```

### Background Worker (HostedService)
Ubicación: `/Features/AI/Workers/GeminiCacheRenewalWorker.cs`

```csharp
public class GeminiCacheRenewalWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<GeminiCacheRenewalWorker> _logger;

    public GeminiCacheRenewalWorker(IServiceProvider serviceProvider, ILogger<GeminiCacheRenewalWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(3));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var renewalProcessor = scope.ServiceProvider.GetRequiredService<ICacheRenewalProcessor>();
                
                // El método interno llama a `GetAgentsForCacheRenewalAsync` (con SKIP LOCKED).
                // Luego itera sobre los agentes bloqueados y emite el request PATCH documentado arriba.
                await renewalProcessor.ProcessRenewalsAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Bucle de renovación interrumpido forzosamente. Llave BYOK invalidada.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error no controlado en la renovación de caché de Gemini.");
            }
        }
    }
}
```
