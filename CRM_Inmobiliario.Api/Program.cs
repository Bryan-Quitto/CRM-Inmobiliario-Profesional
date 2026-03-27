using CRM_Inmobiliario.Api.Features.Clientes;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Configuración de servicios base
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();

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

// Registro de Features (Vertical Slice)
app.MapRegistrarClienteEndpoint();

app.Run();
