using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class RegistrarPropiedadFeature
{
    public record Command(
        string Titulo,
        string Descripcion,
        string TipoPropiedad,
        string Operacion,
        decimal Precio,
        string Direccion,
        string Sector,
        string Ciudad,
        int Habitaciones,
        decimal Banos,
        decimal AreaTotal);

    public static void MapRegistrarPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/propiedades", async (Command command, CrmDbContext context) =>
        {
            var propiedad = new Property
            {
                Id = Guid.NewGuid(),
                Titulo = command.Titulo,
                Descripcion = command.Descripcion,
                TipoPropiedad = command.TipoPropiedad,
                Operacion = command.Operacion,
                Precio = command.Precio,
                Direccion = command.Direccion,
                Sector = command.Sector,
                Ciudad = command.Ciudad,
                Habitaciones = command.Habitaciones,
                Banos = command.Banos,
                AreaTotal = command.AreaTotal,
                EstadoComercial = "Disponible",
                FechaIngreso = DateTimeOffset.UtcNow
            };

            context.Properties.Add(propiedad);
            await context.SaveChangesAsync();

            return Results.Created($"/api/propiedades/{propiedad.Id}", propiedad);
        })
        .WithTags("Propiedades")
        .WithName("RegistrarPropiedad");
    }
}
