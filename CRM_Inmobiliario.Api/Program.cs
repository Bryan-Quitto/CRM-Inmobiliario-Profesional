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
    var propiedades = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(db.Properties);

    int count = 0;
    foreach (var p in propiedades)
    {
        p.VectorEmbedding = await embeddingService.GenerateEmbeddingForPropertyAsync(p);
        count++;
    }
    await db.SaveChangesAsync();
    return Results.Ok(new { mensaje = $"Se generaron {count} vectores correctamente." });
});

// ENDPOINT TEMPORAL PARA SEED DE PROPIEDADES (Testing)
app.MapPost("/api/admin/seed", async (CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext db) =>
{
    var newProperties = new List<CRM_Inmobiliario.Api.Domain.Entities.Property>
    {
        new CRM_Inmobiliario.Api.Domain.Entities.Property
        {
            Id = Guid.NewGuid(),
            Titulo = "Casa familiar en zona tranquila",
            Descripcion = "Hermosa casa de dos pisos, ideal para una familia. Cerca de escuelas y parques.",
            Precio = 185000,
            Sector = "Norte",
            Ciudad = "Quito",
            Direccion = "Av. Siempre Viva 123",
            Habitaciones = 3,
            Banos = 2,
            Estacionamientos = 2,
            AniosAntiguedad = 5,
            AreaTotal = 150,
            AreaConstruccion = 120,
            AreaTerreno = 150,
            Operacion = "Venta",
            TipoPropiedad = "Casa",
            EstadoComercial = "Disponible",
            UrlRemax = "https://remax.com/prop-185k",
            FechaIngreso = DateTimeOffset.UtcNow
        },
        new CRM_Inmobiliario.Api.Domain.Entities.Property
        {
            Id = Guid.NewGuid(),
            Titulo = "Quinta en el Valle con gran terreno",
            Descripcion = "Espectacular quinta alejada del ruido de la ciudad. Cuenta con extensas áreas verdes, árboles frutales y un cerramiento seguro, ideal para quienes tienen perros grandes o buscan tranquilidad pura.",
            Precio = 250000,
            Sector = "Valle de los Chillos",
            Ciudad = "Quito",
            Direccion = "Via a Conocoto Km 3",
            Habitaciones = 4,
            Banos = 3,
            Estacionamientos = 4,
            AniosAntiguedad = 10,
            AreaTotal = 1000,
            AreaConstruccion = 250,
            AreaTerreno = 1000,
            Operacion = "Venta",
            TipoPropiedad = "Quinta",
            EstadoComercial = "Disponible",
            UrlRemax = "https://remax.com/prop-valle-perros",
            FechaIngreso = DateTimeOffset.UtcNow
        },
        new CRM_Inmobiliario.Api.Domain.Entities.Property
        {
            Id = Guid.NewGuid(),
            Titulo = "Departamento de lujo con vista al mar",
            Descripcion = "Elegante departamento amoblado, con balcón y vista panorámica. Edificio inteligente con seguridad 24/7.",
            Precio = 320000,
            Sector = "Puerto Santa Ana",
            Ciudad = "Guayaquil",
            Direccion = "Torre Bellini",
            Habitaciones = 2,
            Banos = 2,
            Estacionamientos = 1,
            AniosAntiguedad = 2,
            AreaTotal = 90,
            AreaConstruccion = 90,
            AreaTerreno = 90,
            Operacion = "Venta",
            TipoPropiedad = "Departamento",
            EstadoComercial = "Disponible",
            UrlRemax = "https://remax.com/prop-lujo-gye",
            FechaIngreso = DateTimeOffset.UtcNow
        },
        new CRM_Inmobiliario.Api.Domain.Entities.Property
        {
            Id = Guid.NewGuid(),
            Titulo = "Suite económica y céntrica",
            Descripcion = "Acogedora suite cerca de la zona financiera. Ideal para estudiantes o ejecutivos solteros.",
            Precio = 450,
            Sector = "La Carolina",
            Ciudad = "Quito",
            Direccion = "Av. República de El Salvador",
            Habitaciones = 1,
            Banos = 1,
            Estacionamientos = 1,
            AniosAntiguedad = 8,
            AreaTotal = 50,
            AreaConstruccion = 50,
            AreaTerreno = 50,
            Operacion = "Alquiler",
            TipoPropiedad = "Departamento",
            EstadoComercial = "Disponible",
            UrlRemax = "https://remax.com/prop-suite-carolina",
            FechaIngreso = DateTimeOffset.UtcNow
        }
    };

    db.Properties.AddRange(newProperties);
    await db.SaveChangesAsync();
    
    return Results.Ok(new { mensaje = $"Se insertaron {newProperties.Count} propiedades de prueba exitosamente." });
});

// ENDPOINT TEMPORAL PARA REVERTIR ESCALADO DE CONTACTO (Testing)
app.MapPost("/api/admin/unscale/{id}", async (Guid id, CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext db) =>
{
    var contacto = await db.Contactos.FindAsync(id);
    if (contacto == null) return Results.NotFound();
    
    contacto.EtapaEmbudo = "Interesado"; // O cualquier otra etapa normal
    contacto.Notas = contacto.Notas + "\n[Sistema]: Escalamiento revertido para pruebas.";
    await db.SaveChangesAsync();
    
    return Results.Ok(new { mensaje = $"Contacto {contacto.Nombre} devuelto a estado normal." });
});

// Mapeo de Endpoints (Modularizado)
app.MapProjectEndpoints();

app.Run();
