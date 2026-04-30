using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Features.WhatsApp;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

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
builder.Services.AddScoped<IWhatsAppPromptBuilder, WhatsAppPromptBuilder>();
builder.Services.AddScoped<IWhatsAppToolExecutor, WhatsAppToolExecutor>();
builder.Services.AddScoped<IWhatsAppMessageSender, WhatsAppMessageSender>();
builder.Services.AddScoped<IWhatsAppConversationManager, WhatsAppConversationManager>();
builder.Services.AddScoped<WhatsAppAiService>();

// Handlers de herramientas IA
builder.Services.AddScoped<IWhatsAppToolHandler, BuscarPropiedadesHandler>();
builder.Services.AddScoped<IWhatsAppToolHandler, RegistrarInteresProspectoHandler>();
builder.Services.AddScoped<IWhatsAppToolHandler, RegistrarNuevoLeadHandler>();
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

// Mapeo de Endpoints (Modularizado)
app.MapProjectEndpoints();

app.Run();
