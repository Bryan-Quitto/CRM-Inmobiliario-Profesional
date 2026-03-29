using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class EstablecerImagenPrincipalFeature
{
    public static void MapEstablecerImagenPrincipalEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/propiedades/{propiedadId:guid}/imagenes/{imagenId:guid}/principal", async (
            [FromRoute] Guid propiedadId,
            [FromRoute] Guid imagenId,
            CrmDbContext context) =>
        {
            try 
            {
                // Realizamos TODA la actualización en una sola sentencia SQL atómica.
                // Ponemos EsPrincipal = true si el ID coincide, y false si no coincide.
                var filasAfectadas = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId)
                    .ExecuteUpdateAsync(s => s.SetProperty(m => m.EsPrincipal, m => m.Id == imagenId));

                if (filasAfectadas == 0)
                    return Results.NotFound("No se encontraron imágenes para esta propiedad.");

                return Results.Ok(new { Message = "Imagen de portada actualizada correctamente." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error en EstablecerImagenPrincipal: {ex.Message}");
                return Results.Problem($"Error al actualizar la base de datos: {ex.Message}");
            }
        })
        .WithTags("Propiedades")
        .WithName("EstablecerImagenPrincipal");
    }
}
