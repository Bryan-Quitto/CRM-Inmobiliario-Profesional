using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Caching.Memory;
using CRM_Inmobiliario.Api.Extensions;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Features.WhatsApp;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Tools;
using CRM_Inmobiliario.Api.Features.Facebook.Services;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using Hangfire;
using Hangfire.PostgreSql;
using CRM_Inmobiliario.Api.Features.AI.Infrastructure.Handlers;
using CRM_Inmobiliario.Api.Features.AI.Services;
using CRM_Inmobiliario.Api.Features.Agents.Services;
using Amazon.S3;
using CRM_Inmobiliario.Api.Infrastructure.Services;
// Cargar variables de entorno desde .env en desarrollo local.
// En Railway (producción), las variables son inyectadas por la plataforma
// y no existe un archivo .env. El try-catch previene errores de arranque.
try { DotNetEnv.Env.TraversePath().Load(); } catch { /* Ignorado en producción */ }

var builder = WebApplication.CreateBuilder(args);

// Logging
builder.Logging.AddFilter("System.Net.Http.HttpClient", LogLevel.Warning);
builder.Logging.AddFilter("System.Net.Http.HttpClient.IGeminiApiClient.LogicalHandler", LogLevel.Information); // Ver los requests a Gemini
builder.Logging.AddFilter("Polly", LogLevel.Error); // Ocultar el spam de OnRetry de Polly

// Extensiones de Configuración (Modularizado)
builder.Services.AddProjectInfrastructure(builder.Configuration, builder.Environment);
builder.Services.AddProjectAuthentication(builder.Configuration);

// Cache de Salida
builder.Services.AddOutputCache(options => {
    options.AddBasePolicy(b => b.Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
});

// Configuración de límites de carga
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 25 * 1024 * 1024; // 25 MB
});


// Inyección de Dependencias (Slices & IA)
    builder.Services.AddScoped<IAgentStateService, AgentStateService>();
builder.Services.AddTransient<ByokCircuitBreakerHandler>();

builder.Services.AddHttpClient<IGeminiApiClient, GeminiApiClient>()
    .AddHttpMessageHandler<ByokCircuitBreakerHandler>()
    .AddStandardResilienceHandler(options =>
    {
        options.Retry.MaxRetryAttempts = 8;
        options.Retry.Delay = TimeSpan.FromSeconds(5);
        options.Retry.BackoffType = Polly.DelayBackoffType.Exponential;
        options.AttemptTimeout.Timeout = TimeSpan.FromMinutes(2);
        options.CircuitBreaker.SamplingDuration = TimeSpan.FromMinutes(5); // Requerido: al menos doble del AttemptTimeout
        options.TotalRequestTimeout.Timeout = TimeSpan.FromMinutes(10); // Aumentado para soportar múltiples reintentos largos
    });

builder.Services.AddHttpClient("LLMProviders")
    .AddStandardResilienceHandler(options =>
    {
        options.Retry.MaxRetryAttempts = 3;
        options.Retry.Delay = TimeSpan.FromSeconds(2);
        options.TotalRequestTimeout.Timeout = TimeSpan.FromSeconds(30);
    });

builder.Services.AddHttpClient();
builder.Services.ConfigureHttpClientDefaults(b => b.AddStandardResilienceHandler());

// Configuración de Hangfire
var dbString = Environment.GetEnvironmentVariable("DATABASE_URL");
builder.Services.AddHangfire(config => config.UsePostgreSqlStorage(options => options.UseNpgsqlConnection(dbString)));
builder.Services.AddHangfireServer(options =>
{
    options.WorkerCount = 5; // Conservador: sistema acotado a máximo 21 usuarios concurrentes
    options.ServerName = $"crm-railway-{Environment.MachineName}";
});
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService, CRM_Inmobiliario.Api.Features.Propiedades.Services.PropertyEmbeddingService>();
builder.Services.AddScoped<IWhatsAppPromptBuilder, WhatsAppPromptBuilder>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.ICoreAiToolExecutor, CRM_Inmobiliario.Api.Features.CoreAi.Services.CoreAiToolExecutor>();
builder.Services.AddHttpClient<IWhatsAppMessageSender, WhatsAppMessageSender>()
    .AddStandardResilienceHandler();
builder.Services.AddHttpClient<IWhatsAppMediaService, WhatsAppMediaService>()
    .AddStandardResilienceHandler();
builder.Services.AddScoped<LLMProviderFactory>();
builder.Services.AddScoped<IWhatsAppContactProcessor, WhatsAppContactProcessor>();
builder.Services.AddScoped<IWhatsAppBotRulesProcessor, WhatsAppBotRulesProcessor>();
builder.Services.AddScoped<IWhatsAppMemoryProcessor, WhatsAppMemoryProcessor>();
builder.Services.AddScoped<IWhatsAppTokenUsageProcessor, WhatsAppTokenUsageProcessor>();
builder.Services.AddScoped<IWhatsAppConversationManager, WhatsAppConversationManager>();
builder.Services.AddScoped<IWhatsAppLlmOrchestrator, WhatsAppLlmOrchestrator>();
builder.Services.AddScoped<WhatsAppAiService>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.ISemanticRouterService, CRM_Inmobiliario.Api.Features.CoreAi.Services.SemanticRouterService>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.AgentAi.Services.AgentSystemPromptFactory>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.AgentAi.Services.AgentAiService>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.AgentAi.Services.AgentTitleGeneratorService>();
builder.Services.AddScoped<IWhatsAppJobProcessor, WhatsAppJobProcessor>();

// Facebook Messenger Stack
builder.Services.AddHttpClient<IFacebookMessageSender, FacebookMessageSender>()
    .AddStandardResilienceHandler();
builder.Services.AddScoped<IFacebookJobProcessor, FacebookJobProcessor>();
builder.Services.AddScoped<FacebookAiService>();

// Handlers de herramientas IA
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, BuscarPropiedadesHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, ConsultarBaseConocimientoHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, ConsultarDetallesPropiedadHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, RegistrarInteresClienteHandler>();

builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, DerivarCaptacionPropietarioHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, SolicitarAsistenciaHumanaHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, CRM_Inmobiliario.Api.Features.AgentAi.Tools.ResumirHistorialContacto.ResumirHistorialContactoHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, CRM_Inmobiliario.Api.Features.AgentAi.Tools.ConsultarInteraccionesCliente.ConsultarInteraccionesClienteHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, CRM_Inmobiliario.Api.Features.AgentAi.Tools.CrearTareaCRM.CrearTareaCRMHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, CRM_Inmobiliario.Api.Features.AgentAi.Tools.GenerarCotizacionRapidaHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools.ICoreAiToolHandler, CRM_Inmobiliario.Api.Features.CoreAi.Tools.EnviarFotosPropiedadHandler>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Services.IPropertyGalleryAiDispatcher, CRM_Inmobiliario.Api.Features.CoreAi.Services.PropertyGalleryAiDispatcher>();

builder.Services.AddSingleton<IPdfGeneratorQueue, PdfGeneratorQueue>();
builder.Services.AddSingleton<IKpiWarmingService, KpiWarmingService>();

var r2AccessKey = builder.Configuration["R2_ACCESS_KEY_ID"];
var r2SecretKey = builder.Configuration["R2_SECRET_ACCESS_KEY"];
var r2AccountId = builder.Configuration["R2_ACCOUNT_ID"];
if (!string.IsNullOrEmpty(r2AccessKey) && !string.IsNullOrEmpty(r2SecretKey) && !string.IsNullOrEmpty(r2AccountId))
{
    var s3Config = new AmazonS3Config
    {
        ServiceURL = $"https://{r2AccountId}.r2.cloudflarestorage.com",
    };
    var awsCredentials = new Amazon.Runtime.BasicAWSCredentials(r2AccessKey, r2SecretKey);
    builder.Services.AddSingleton<IAmazonS3>(new AmazonS3Client(awsCredentials, s3Config));
    builder.Services.AddSingleton<IR2StorageService, R2StorageService>();
}
builder.Services.AddHostedService<PdfWorker>();
builder.Services.AddHostedService<KpiWarmingBackgroundService>();
builder.Services.AddScoped<ResetAiBotDailyLimitsJob>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.Tareas.Jobs.EnqueueTaskNotificationsJob>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.Tareas.Jobs.ProcessWebPushOutboxJob>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.CoreAi.Jobs.EscalamientoTimerJob>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Infrastructure.BackgroundServices.AutoArchiveEntitiesJob>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Infrastructure.BackgroundServices.InactivePropertyMediaCleanupJob>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Infrastructure.BackgroundServices.LimpiezaPdfsObsoletosJob>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Infrastructure.BackgroundServices.ClosedPropertyMediaCleanupJob>();
builder.Services.AddScoped<CRM_Inmobiliario.Api.Features.PushNotifications.Services.IPushNotificationService, CRM_Inmobiliario.Api.Features.PushNotifications.Services.PushNotificationService>();

builder.Services.AddProblemDetails(); // RFC 7807 (ProblemDetails)

var app = builder.Build();

// Middlewares
app.UseExceptionHandler();
if (app.Environment.IsDevelopment()) app.UseDeveloperExceptionPage();



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
                
                isActivoVal = isActivo.HasValue ? isActivo.Value : false;
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

// Configurar Hangfire Dashboard
app.UseHangfireDashboard("/hangfire", new DashboardOptions
{
    Authorization = new[] { new AdminAuthorizationFilter() }
});

// Registrar Job Recurrente de Hangfire (00:00 UTC-5 equivale a 05:00 UTC)
app.Lifetime.ApplicationStarted.Register(() => 
{
    RecurringJob.AddOrUpdate<ResetAiBotDailyLimitsJob>(
        "reset-ai-bot-daily-limits",
        job => job.ResetDailyLimitsAsync(),
        "0 5 * * *"); // A las 05:00 UTC (Media noche en UTC-5)

    // Notificaciones Outbox
    RecurringJob.AddOrUpdate<CRM_Inmobiliario.Api.Features.Tareas.Jobs.EnqueueTaskNotificationsJob>(
        "enqueue-task-notifications",
        job => job.ProcessNotificationsAsync(),
        "* * * * *"); // Cada minuto

    RecurringJob.AddOrUpdate<CRM_Inmobiliario.Api.Features.Tareas.Jobs.ProcessWebPushOutboxJob>(
        "process-web-push-outbox",
        job => job.ExecuteAsync(),
        "* * * * *");

    // Limpieza de inactivos
    RecurringJob.AddOrUpdate<CRM_Inmobiliario.Api.Infrastructure.BackgroundServices.AutoArchiveEntitiesJob>(
        "daily-auto-archive-entities",
        job => job.ExecuteAsync(),
        "0 7 * * *");

    RecurringJob.AddOrUpdate<CRM_Inmobiliario.Api.Infrastructure.BackgroundServices.InactivePropertyMediaCleanupJob>(
        "cleanup-inactive-properties-media",
        job => job.ExecuteAsync(),
        "0 8 1 * *");

    // Limpieza vendidas
    RecurringJob.AddOrUpdate<CRM_Inmobiliario.Api.Infrastructure.BackgroundServices.ClosedPropertyMediaCleanupJob>(
        "cleanup-closed-properties-media",
        job => job.ExecuteAsync(),
        "0 9 1 * *"); // 09:00 UTC (04:00 AM UTC-5) el día 1 de cada mes

    RecurringJob.AddOrUpdate<CRM_Inmobiliario.Api.Infrastructure.BackgroundServices.LimpiezaPdfsObsoletosJob>(
        "limpieza-pdfs-obsoletos-daily",
        job => job.ExecuteAsync(CancellationToken.None),
        "0 3 * * *" // Todos los días a las 3:00 AM
    );
});



// Mapeo de Endpoints (Modularizado)
app.MapProjectEndpoints();

app.MapPost("/api/properties/fix-embeddings", async (CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext db, CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService es) => {
    var props = await db.Properties.Include(p => p.Agente).Where(p => p.GeminiEmbedding == null).ToListAsync();
    foreach(var p in props) {
        await es.GenerateEmbeddingForPropertyAsync(p);
    }
    await db.SaveChangesAsync();
    return Results.Ok($"Fixed {props.Count} properties.");
});



app.Run();

public class AdminAuthorizationFilter : Hangfire.Dashboard.IDashboardAuthorizationFilter
{
    public bool Authorize(Hangfire.Dashboard.DashboardContext context)
    {
        var httpContext = ((Hangfire.Dashboard.AspNetCoreDashboardContext)context).HttpContext;
        if (httpContext == null) return false;
        
        if (httpContext.User.Identity?.IsAuthenticated != true) return false;
        
        var roleClaim = httpContext.User.FindFirst(c => c.Type == "Rol" || c.Type == System.Security.Claims.ClaimTypes.Role);
        if (roleClaim?.Value == "Admin") return true;

        var appMetadataClaim = httpContext.User.FindFirst("app_metadata")?.Value;
        if (!string.IsNullOrEmpty(appMetadataClaim))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(appMetadataClaim);
                if (doc.RootElement.TryGetProperty("role", out var roleElement) && roleElement.GetString() == "Admin")
                {
                    return true;
                }
            }
            catch {}
        }
        
        return false;
    }
}

public partial class Program { }

