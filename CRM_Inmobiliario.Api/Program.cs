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

// Registro estándar de EF Core con Ciclo de Vida Scoped para las peticiones HTTP
builder.Services.AddDbContext<CrmDbContext>(options => 
{
    options.UseNpgsql(connectionString, npgsqlOptions => 
    {
        npgsqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
    });

    // Habilitar logs sensibles estrictamente solo en entorno de desarrollo
    if (builder.Environment.IsDevelopment())
    {
        options.EnableDetailedErrors();
        options.EnableSensitiveDataLogging();
    }
});

// Cliente de Supabase configurado con SERVICE_ROLE para permisos totales (Storage/Auth)
var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL");
var supabaseRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");

builder.Services.AddScoped(_ => new Supabase.Client(
    supabaseUrl!,
    supabaseRoleKey, // Usamos la Role Key para que el Backend pueda borrar archivos
    new Supabase.SupabaseOptions { AutoConnectRealtime = true }
));

// Auth configurada para Supabase usando OIDC nativo y Authority
// Esto maneja automáticamente el JWKS, asincronía y caché de llaves.
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = $"{supabaseUrl}/auth/v1";
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = $"{supabaseUrl}/auth/v1",
            ValidateAudience = true,
            ValidAudience = "authenticated",
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
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

// Fase 1: Cola de Generación de PDFs y Warming de KPIs
builder.Services.AddSingleton<IPdfGeneratorQueue, PdfGeneratorQueue>();
builder.Services.AddSingleton<IPdfCleanupQueue, PdfCleanupQueue>();
builder.Services.AddSingleton<IKpiWarmingService, KpiWarmingService>();

// Fase 2: Background Services (Los Obreros)
builder.Services.AddHostedService<PdfWorker>();
builder.Services.AddHostedService<PdfCleanupWorker>();
builder.Services.AddHostedService<KpiWarmingBackgroundService>();

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
apiGroup.MapBuscarClientesEndpoint();
apiGroup.MapListarClientesEndpoint().CacheOutput();
apiGroup.MapObtenerClientePorIdEndpoint();
apiGroup.MapActualizarClienteEndpoint();
apiGroup.MapCambiarEtapaClienteEndpoint();

// Propiedades
apiGroup.MapRegistrarPropiedadEndpoint();
apiGroup.MapBuscarPropiedadesEndpoint();
apiGroup.MapListarPropiedadesEndpoint().CacheOutput();
apiGroup.MapObtenerPropiedadPorIdEndpoint();
apiGroup.MapActualizarPropiedadEndpoint();
apiGroup.MapCambiarEstadoPropiedadEndpoint();
apiGroup.MapEliminarImagenPropiedadEndpoint();
apiGroup.MapSubirImagenPropiedadEndpoint();
apiGroup.MapEliminarTodasLasImagenesEndpoint();
apiGroup.MapEstablecerImagenPrincipalEndpoint();
apiGroup.MapLimpiarImagenesPropiedadEndpoint();
apiGroup.MapEliminarImagenesSeleccionadasEndpoint();

// Tareas
apiGroup.MapRegistrarTareaEndpoint();
apiGroup.MapListarTareasEndpoint().CacheOutput();
apiGroup.MapObtenerTareaPorIdEndpoint();
apiGroup.MapActualizarTareaEndpoint();
apiGroup.MapCompletarTareaEndpoint();
apiGroup.MapCancelarTareaEndpoint();

// Secciones de Galería
apiGroup.MapRegistrarSeccionEndpoint();
apiGroup.MapActualizarSeccionEndpoint();
apiGroup.MapEliminarSeccionEndpoint();
apiGroup.MapReordenarSeccionesEndpoint();
apiGroup.MapActualizarDescripcionMultimediaEndpoint();

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
apiGroup.MapInvitarAgenteEndpoint();

// Calendario
apiGroup.MapListarEventosEndpoint().CacheOutput();
apiGroup.MapReprogramarEventoEndpoint();

// Analítica
apiGroup.MapObtenerActividadEndpoint().CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization").SetVaryByQuery("inicio", "fin"));
apiGroup.MapObtenerVentasMensualesEndpoint();
apiGroup.MapObtenerSeguimientoEndpoint().CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
apiGroup.MapObtenerProyeccionesEndpoint().CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
apiGroup.MapObtenerEficienciaEndpoint().CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));

app.Run();
