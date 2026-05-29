using Microsoft.Extensions.Caching.Memory;
using CRM_Inmobiliario.Api.Extensions;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Features.WhatsApp;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using Hangfire;
using Hangfire.PostgreSql;
using CRM_Inmobiliario.Api.Features.AI.Infrastructure.Handlers;
using CRM_Inmobiliario.Api.Features.AI.Services;
using CRM_Inmobiliario.Api.Features.AI.Workers;
using CRM_Inmobiliario.Api.Features.Agents.Services;
// Cargar variables de entorno
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// Logging
builder.Logging.AddFilter("System.Net.Http.HttpClient", LogLevel.Warning);

// Extensiones de Configuración (Modularizado)
builder.Services.AddProjectInfrastructure(builder.Configuration, builder.Environment);
builder.Services.AddProjectAuthentication();

// Cache de Salida
builder.Services.AddOutputCache(options => {
    options.AddBasePolicy(b => b.Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
});

// Inyección de Dependencias (Slices & IA)
builder.Services.AddScoped<IAgentStateService, AgentStateService>();
builder.Services.AddScoped<ICacheRenewalProcessor, CacheRenewalProcessor>();
builder.Services.AddTransient<ByokCircuitBreakerHandler>();

builder.Services.AddHttpClient<IGeminiApiClient, GeminiApiClient>()
    .AddHttpMessageHandler<ByokCircuitBreakerHandler>()
    .AddStandardResilienceHandler(options =>
    {
        options.Retry.MaxRetryAttempts = 5;
        options.Retry.Delay = TimeSpan.FromSeconds(2);
    });

builder.Services.AddHttpClient();
builder.Services.ConfigureHttpClientDefaults(b => b.AddStandardResilienceHandler());

// Configuración de Hangfire
var dbString = Environment.GetEnvironmentVariable("DATABASE_URL");
builder.Services.AddHangfire(config => config.UsePostgreSqlStorage(options => options.UseNpgsqlConnection(dbString)));
builder.Services.AddHangfireServer();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService, CRM_Inmobiliario.Api.Features.Propiedades.Services.PropertyEmbeddingService>();
builder.Services.AddScoped<IWhatsAppPromptBuilder, WhatsAppPromptBuilder>();
builder.Services.AddScoped<IWhatsAppToolExecutor, WhatsAppToolExecutor>();
builder.Services.AddHttpClient<IWhatsAppMessageSender, WhatsAppMessageSender>()
    .AddStandardResilienceHandler();
builder.Services.AddHttpClient<IWhatsAppMediaService, WhatsAppMediaService>()
    .AddStandardResilienceHandler();
builder.Services.AddScoped<IWhatsAppConversationManager, WhatsAppConversationManager>();
builder.Services.AddScoped<WhatsAppAiService>();
builder.Services.AddScoped<IWhatsAppJobProcessor, WhatsAppJobProcessor>();

// Handlers de herramientas IA
builder.Services.AddScoped<IWhatsAppToolHandler, BuscarPropiedadesHandler>();
builder.Services.AddScoped<IWhatsAppToolHandler, ConsultarBaseConocimientoHandler>();
builder.Services.AddScoped<IWhatsAppToolHandler, ConsultarDetallesPropiedadHandler>();
builder.Services.AddScoped<IWhatsAppToolHandler, RegistrarInteresContactoHandler>();
builder.Services.AddScoped<IWhatsAppToolHandler, RegistrarNuevoContactoHandler>();
builder.Services.AddScoped<IWhatsAppToolHandler, DerivarCaptacionPropietarioHandler>();
builder.Services.AddScoped<IWhatsAppToolHandler, SolicitarAsistenciaHumanaHandler>();

// Background Services
builder.Services.AddSingleton<IPdfGeneratorQueue, PdfGeneratorQueue>();
builder.Services.AddSingleton<IPdfCleanupQueue, PdfCleanupQueue>();
builder.Services.AddSingleton<IKpiWarmingService, KpiWarmingService>();
builder.Services.AddHostedService<PdfWorker>();
builder.Services.AddHostedService<PdfCleanupWorker>();
builder.Services.AddHostedService<KpiWarmingBackgroundService>();
builder.Services.AddHostedService<GeminiCacheRenewalWorker>();
builder.Services.AddScoped<TokenLimitResetJob>();

var app = builder.Build();

// Middlewares
if (app.Environment.IsDevelopment()) app.UseDeveloperExceptionPage();

app.Use(async (context, next) => {
    await next();
    if (context.Response.StatusCode == 401) Console.WriteLine($"WARN [401]: {context.Request.Method} {context.Request.Path}");
});

if (!app.Environment.IsDevelopment()) app.UseHttpsRedirection();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Middleware de bloqueo inmediato para agentes inactivos
app.Use(async (context, next) => {
    if (context.User.Identity?.IsAuthenticated == true)
    {
        var userIdString = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdString, out Guid userId))
        {
            var cache = context.RequestServices.GetRequiredService<Microsoft.Extensions.Caching.Memory.IMemoryCache>();
            var cacheKey = $"agent_activo_{userId}";

            if (!cache.TryGetValue(cacheKey, out bool isActivoVal))
            {
                var db = context.RequestServices.GetRequiredService<CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext>();
                var isActivo = await db.Agents
                    .Where(a => a.Id == userId)
                    .Select(a => (bool?)a.Activo)
                    .FirstOrDefaultAsync();
                
                isActivoVal = isActivo.HasValue ? isActivo.Value : true;
                cache.Set(cacheKey, isActivoVal, TimeSpan.FromMinutes(5));
            }

            if (!isActivoVal)
            {
                context.Response.StatusCode = 403;
                await context.Response.WriteAsJsonAsync(new { error = "Account is deactivated." });
                return; // Cortocircuitar la petición
            }
        }
    }
    await next();
});

app.UseOutputCache();

// Configurar Hangfire Dashboard (opcional)
app.UseHangfireDashboard("/hangfire");

// Registrar Job Recurrente de Hangfire (00:00 UTC-5 equivale a 05:00 UTC)
app.Lifetime.ApplicationStarted.Register(() => 
{
    RecurringJob.AddOrUpdate<TokenLimitResetJob>(
        "reset-daily-token-limits", 
        job => job.ResetDailyLimitsAsync(), 
        "0 5 * * *" 
    );
});



// Mapeo de Endpoints (Modularizado)
app.MapProjectEndpoints();

app.Run();
