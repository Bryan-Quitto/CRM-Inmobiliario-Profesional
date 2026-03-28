using CRM_Inmobiliario.Api.Features.Clientes;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configuración de servicios base
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

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
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

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
app.MapCambiarEtapaClienteEndpoint();

// Propiedades
app.MapRegistrarPropiedadEndpoint();
app.MapListarPropiedadesEndpoint();
app.MapObtenerPropiedadPorIdEndpoint();
app.MapCambiarEstadoPropiedadEndpoint();

app.Run();
