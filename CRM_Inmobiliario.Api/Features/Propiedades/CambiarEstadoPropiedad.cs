using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoPropiedadFeature
{
    public record Command(string NuevoEstado);

    public static void MapCambiarEstadoPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/propiedades/{id:guid}/estado", async (Guid id, Command command, CrmDbContext context) =>
        {
            var propiedad = await context.Properties.FindAsync(id);

            if (propiedad is null)
            {
                return Results.NotFound(new { Message = "La propiedad no existe." });
            }

            propiedad.EstadoComercial = command.NuevoEstado;

            // Si el estado es "Vendida" o "Alquilada", podríamos registrar la fecha de cierre
            if (command.NuevoEstado is "Vendida" or "Alquilada")
            {
                propiedad.FechaCierre = DateTimeOffset.UtcNow;
            }
            else
            {
                propiedad.FechaCierre = null;
            }

            await context.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithTags("Propiedades")
        .WithName("CambiarEstadoPropiedad");
    }
}
