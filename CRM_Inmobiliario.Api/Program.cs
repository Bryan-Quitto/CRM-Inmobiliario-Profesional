using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Features.WhatsApp;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using Hangfire;
using Hangfire.PostgreSql;

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
app.UseOutputCache();

// Configurar Hangfire Dashboard (opcional)
app.UseHangfireDashboard("/hangfire");

// ENDPOINT TEMPORAL PARA RE-VECTORIZAR PROPIEDADES (Spec 018)
app.MapPost("/api/admin/re-vectorize", async (
    CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext db, 
    CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService embeddingService) =>
{
    var properties = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(db.Properties.Where(p => p.VectorEmbedding == null));
    int count = 0;
    foreach(var p in properties)
    {
        p.VectorEmbedding = await embeddingService.GenerateEmbeddingForPropertyAsync(p);
        count++;
    }
    await db.SaveChangesAsync();
    return Microsoft.AspNetCore.Http.Results.Ok(new { Mensaje = $"Se generaron {count} vectores correctamente." });
});

// Mapeo de Endpoints (Modularizado)
app.MapProjectEndpoints();

app.Run();
