using CRM_Inmobiliario.Api.Features.Intereses;
using CRM_Inmobiliario.Api.Features.Clientes;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Features.Tareas;
using CRM_Inmobiliario.Api.Features.Interacciones;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Supabase;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

// Cargar variables de entorno desde el archivo .env en la raíz del proyecto
Env.Load(Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"));

var builder = WebApplication.CreateBuilder(args);

// ConfiguraciÃ³n de servicios base
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHttpsRedirection(options =>
{
    // Usamos el puerto configurado en launchSettings.json (7046) o 443 por defecto
    options.HttpsPort = 7046;
});


// Configuración de Supabase Client usando variables de entorno
builder.Services.AddScoped<Supabase.Client>(_ => 
{
    var url = Environment.GetEnvironmentVariable("SUPABASE_URL") ?? builder.Configuration["Supabase:Url"]!;
    
    // Priorizamos la ROLE_KEY (Service Role) para el backend, ya que permite bypass de RLS
    var key = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY") 
              ?? Environment.GetEnvironmentVariable("SUPABASE_KEY") 
              ?? builder.Configuration["Supabase:Key"]!;

    return new Supabase.Client(url, key, new SupabaseOptions { AutoConnectRealtime = true });
});
// Configuración de Autenticación JWT (Supabase con llaves rotativas)
var supabaseUrl = Environment.GetEnvironmentVariable("SUPABASE_URL") ?? builder.Configuration["Supabase:Url"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // Con Authority, .NET descarga automáticamente el JWKS desde {supabaseUrl}/auth/v1/.well-known/jwks.json
    options.Authority = $"{supabaseUrl}/auth/v1";
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = $"{supabaseUrl}/auth/v1",
        ValidateAudience = true,
        ValidAudience = "authenticated",
        ValidateLifetime = true,
        // Al usar Authority/JWKS, .NET gestiona la rotación de llaves automáticamente
    };
});


builder.Services.AddAuthorization();

// Configuración de CORS para el Frontend (Vite default: http://localhost:5173)
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Configuración de EF Core con PostgreSQL (Npgsql)
builder.Services.AddDbContext<CrmDbContext>(options =>
    options.UseNpgsql(Environment.GetEnvironmentVariable("DATABASE_URL") ?? builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Pipeline de middleware
app.UseCors("FrontendPolicy");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Middlewares de Autenticación y Autorización
app.UseAuthentication();
app.UseAuthorization();

// Registro de Features (Vertical Slice) con protección global
var apiGroup = app.MapGroup("/api").RequireAuthorization();

apiGroup.MapRegistrarClienteEndpoint();
apiGroup.MapListarClientesEndpoint();
apiGroup.MapObtenerClientePorIdEndpoint();
apiGroup.MapCambiarEtapaClienteEndpoint();
apiGroup.MapVincularPropiedadEndpoint();
apiGroup.MapDesvincularPropiedadEndpoint();

// Propiedades
apiGroup.MapRegistrarPropiedadEndpoint();
apiGroup.MapListarPropiedadesEndpoint();
apiGroup.MapObtenerPropiedadPorIdEndpoint();
apiGroup.MapCambiarEstadoPropiedadEndpoint();
apiGroup.MapSubirImagenPropiedadEndpoint();
apiGroup.MapEstablecerImagenPrincipalEndpoint();
apiGroup.MapEliminarImagenPropiedadEndpoint();
apiGroup.MapEliminarTodasLasImagenesEndpoint();
apiGroup.MapEliminarImagenesSeleccionadasEndpoint();
apiGroup.MapLimpiarImagenesPropiedadEndpoint();

// Tareas
apiGroup.MapRegistrarTareaEndpoint();
apiGroup.MapListarTareasEndpoint();
apiGroup.MapCompletarTareaEndpoint();
apiGroup.MapObtenerTareaPorIdEndpoint();
apiGroup.MapActualizarTareaEndpoint();
apiGroup.MapCancelarTareaEndpoint();

// Interacciones
apiGroup.MapRegistrarInteraccionEndpoint();
apiGroup.MapActualizarInteraccionEndpoint();
apiGroup.MapEliminarInteraccionEndpoint();

// Dashboard
apiGroup.MapObtenerKpisEndpoint();

app.Run();
