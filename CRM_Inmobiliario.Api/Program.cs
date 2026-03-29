using CRM_Inmobiliario.Api.Features.Clientes;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Features.Tareas;
using CRM_Inmobiliario.Api.Features.Interacciones;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Supabase;
using DotNetEnv;

// Cargar variables de entorno desde el archivo .env en la raíz del proyecto
Env.Load(Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"));

var builder = WebApplication.CreateBuilder(args);

// Configuración de servicios base
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

// Configuración de Supabase Client usando variables de entorno
builder.Services.AddScoped<Supabase.Client>(_ => 
    new Supabase.Client(
        Environment.GetEnvironmentVariable("SUPABASE_URL") ?? builder.Configuration["Supabase:Url"]!,
        Environment.GetEnvironmentVariable("SUPABASE_KEY") ?? builder.Configuration["Supabase:Key"],
        new SupabaseOptions { AutoConnectRealtime = true }));

// Configuración de CORS para el Frontend (Vite default: http://localhost:5173)
builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configuración de EF Core con PostgreSQL (Npgsql)
builder.Services.AddDbContext<CrmDbContext>(options =>
    options.UseNpgsql(Environment.GetEnvironmentVariable("DATABASE_URL") ?? builder.Configuration.GetConnectionString("DefaultConnection")));

var app = builder.Build();

// Pipeline de middleware
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors("FrontendPolicy");

// Registro de Features (Vertical Slice)
app.MapRegistrarClienteEndpoint();
app.MapListarClientesEndpoint();
app.MapObtenerClientePorIdEndpoint();
app.MapCambiarEtapaClienteEndpoint();

// Propiedades
app.MapRegistrarPropiedadEndpoint();
app.MapListarPropiedadesEndpoint();
app.MapObtenerPropiedadPorIdEndpoint();
app.MapCambiarEstadoPropiedadEndpoint();
app.MapSubirImagenPropiedadEndpoint();
app.MapEstablecerImagenPrincipalEndpoint();

// Tareas
app.MapRegistrarTareaEndpoint();
app.MapListarTareasEndpoint();
app.MapCompletarTareaEndpoint();
app.MapObtenerTareaPorIdEndpoint();
app.MapActualizarTareaEndpoint();
app.MapCancelarTareaEndpoint();

// Interacciones
app.MapRegistrarInteraccionEndpoint();

app.Run();
