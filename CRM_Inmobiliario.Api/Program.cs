using System.Text.Json.Serialization;
using CRM_Inmobiliario.Api.Features.Analitica;
using CRM_Inmobiliario.Api.Features.Calendario;
using CRM_Inmobiliario.Api.Features.Clientes;
using CRM_Inmobiliario.Api.Features.Configuracion;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Features.Interacciones;
using CRM_Inmobiliario.Api.Features.Intereses;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Features.SeccionesGaleria;
using CRM_Inmobiliario.Api.Features.Tareas;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;

// Cargar variables de entorno desde .env escalando hasta la raíz (TraversePath)
DotNetEnv.Env.TraversePath().Load();

var builder = WebApplication.CreateBuilder(args);

// Silenciar logs ruidosos de HttpClient
builder.Logging.AddFilter("System.Net.Http.HttpClient", LogLevel.Warning);

// Configuración de JSON para manejar Enums y evitar ciclos
builder.Services.ConfigureHttpJsonOptions(options => {
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

// Configuración de PostgreSQL usando DATABASE_URL del .env
var connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");

// Unificamos la configuración: Factoría (Singleton) + Registro del DbContext (Scoped)
builder.Services.AddDbContextFactory<CrmDbContext>(options =>
    options.UseNpgsql(connectionString));

// Esto permite que el resto de los endpoints sigan inyectando CrmDbContext normalmente
builder.Services.AddScoped(sp => 
    sp.GetRequiredService<IDbContextFactory<CrmDbContext>>().CreateDbContext());

// Cliente de Supabase configurado con SERVICE_ROLE para permisos totales (Storage/Auth)
var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL");
var supabaseRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");

builder.Services.AddScoped(_ => new Supabase.Client(
    supabaseUrl!,
    supabaseRoleKey, // Usamos la Role Key para que el Backend pueda borrar archivos
    new Supabase.SupabaseOptions { AutoConnectRealtime = true }
));

// Auth configurada para Supabase usando JWKS dinámico
var jwksUrl = $"{supabaseUrl}/auth/v1/.well-known/jwks.json";
var httpClient = new HttpClient();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateIssuerSigningKey = true,
            
            // Resolución dinámica de llaves JWKS de Supabase
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
            {
                try 
                {
                    var jwksJson = httpClient.GetStringAsync(jwksUrl).GetAwaiter().GetResult();
                    return new JsonWebKeySet(jwksJson).GetSigningKeys();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"DEBUG [JWKS]: Error -> {ex.Message}");
                    return Enumerable.Empty<SecurityKey>();
                }
            },
            ClockSkew = TimeSpan.Zero
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"DEBUG [Auth]: Falló -> {context.Exception.Message}");
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                // Solo loguear si hay un error real para no saturar
                if (!string.IsNullOrEmpty(context.Error))
                    Console.WriteLine($"DEBUG [Auth]: 401 disparado -> {context.Error}");
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddCors(options => options.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// Cache de Salida (Output Caching)
builder.Services.AddOutputCache(options => {
    options.AddBasePolicy(builder => 
        builder.Expire(TimeSpan.FromMinutes(5))
               .SetVaryByHeader("Authorization"));
});

// Infraestructura de Red
builder.Services.AddHttpClient();

// Fase 1: Cola de Generación de PDFs
builder.Services.AddSingleton<IPdfGeneratorQueue, PdfGeneratorQueue>();
builder.Services.AddSingleton<IPdfCleanupQueue, PdfCleanupQueue>();

// Fase 2: Background Service (El Obrero)
builder.Services.AddHostedService<PdfWorker>();
builder.Services.AddHostedService<PdfCleanupWorker>();

// Configuración de QuestPDF (Licencia Comunitaria)
QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

// Middleware de Logging Minimalista para diagnosticar 401s
app.Use(async (context, next) =>
{
    await next();
    if (context.Response.StatusCode == 401)
    {
        Console.WriteLine($"WARN [401]: {context.Request.Method} {context.Request.Path}");
    }
});

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseOutputCache();

// Grupos de Endpoints
var apiGroup = app.MapGroup("/api").RequireAuthorization();

// Clientes
apiGroup.MapRegistrarClienteEndpoint();
apiGroup.MapListarClientesEndpoint().CacheOutput();
apiGroup.MapObtenerClientePorIdEndpoint().CacheOutput();
apiGroup.MapActualizarClienteEndpoint();
apiGroup.MapCambiarEtapaClienteEndpoint();

// Propiedades
apiGroup.MapRegistrarPropiedadEndpoint();
apiGroup.MapListarPropiedadesEndpoint().CacheOutput();
apiGroup.MapObtenerPropiedadPorIdEndpoint().CacheOutput();
apiGroup.MapActualizarPropiedadEndpoint();
apiGroup.MapCambiarEstadoPropiedadEndpoint();
apiGroup.MapSubirImagenPropiedadEndpoint();
apiGroup.MapEstablecerImagenPrincipalEndpoint();
apiGroup.MapEliminarImagenPropiedadEndpoint();
apiGroup.MapEliminarTodasLasImagenesEndpoint();
apiGroup.MapEliminarImagenesSeleccionadasEndpoint();
apiGroup.MapLimpiarImagenesPropiedadEndpoint();

// Secciones de Galería
apiGroup.MapPost("/propiedades/{id:guid}/generar-pdf", async (Guid id, IPdfGeneratorQueue pdfQueue) => 
{
    await pdfQueue.QueuePdfGenerationAsync(id);
    return Results.Accepted();
});

apiGroup.MapGet("/propiedades/{id:guid}/pdf-status", (Guid id, IPdfGeneratorQueue pdfQueue) => 
{
    return Results.Ok(new { isGenerating = pdfQueue.IsGenerating(id) });
});

apiGroup.MapPost("/propiedades/{id:guid}/confirmar-descarga", async (Guid id, IPdfCleanupQueue cleanupQueue) => 
{
    // Programamos la eliminación para dentro de 30 segundos
    await cleanupQueue.QueueDeletionAsync(id, TimeSpan.FromSeconds(30));
    return Results.Ok();
});
apiGroup.MapRegistrarSeccionEndpoint();
apiGroup.MapActualizarSeccionEndpoint();
apiGroup.MapReordenarSeccionesEndpoint();
apiGroup.MapEliminarSeccionEndpoint();
apiGroup.MapActualizarDescripcionMultimediaEndpoint();

// Tareas
apiGroup.MapRegistrarTareaEndpoint();
apiGroup.MapListarTareasEndpoint().CacheOutput();
apiGroup.MapObtenerTareaPorIdEndpoint().CacheOutput();
apiGroup.MapActualizarTareaEndpoint();
apiGroup.MapCompletarTareaEndpoint();
apiGroup.MapCancelarTareaEndpoint();

// Interacciones
apiGroup.MapRegistrarInteraccionEndpoint();
apiGroup.MapActualizarInteraccionEndpoint();
apiGroup.MapEliminarInteraccionEndpoint();

// Intereses
apiGroup.MapVincularPropiedadEndpoint();
apiGroup.MapDesvincularPropiedadEndpoint();

// Dashboard
apiGroup.MapObtenerKpisEndpoint();

// Configuracion
apiGroup.MapObtenerPerfilEndpoint();
apiGroup.MapActualizarPerfilEndpoint();

// Calendario
apiGroup.MapListarEventosEndpoint().CacheOutput();
apiGroup.MapReprogramarEventoEndpoint();

// Analítica
apiGroup.MapObtenerActividadEndpoint().CacheOutput(p => p.Tag("Actividad").SetVaryByHeader("Authorization").SetVaryByQuery("agenteId"));
apiGroup.MapObtenerSeguimientoEndpoint().CacheOutput();
apiGroup.MapObtenerProyeccionesEndpoint().CacheOutput();
apiGroup.MapObtenerEficienciaEndpoint().CacheOutput();

app.Run();
