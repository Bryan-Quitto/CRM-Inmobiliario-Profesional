using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
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
        app.MapPatch("/propiedades/{propiedadId:guid}/imagenes/{imagenId:guid}/principal", async (
            [FromRoute] Guid propiedadId,
            [FromRoute] Guid imagenId,
            ClaimsPrincipal user,
            CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            try 
            {
                // Verificar que la propiedad pertenezca al agente
                var autorizacion = await context.Properties
                    .AnyAsync(p => p.Id == propiedadId && (p.AgenteId == agenteId || p.CreatedByAgenteId == agenteId));

                if (!autorizacion)
                    return Results.NotFound("Propiedad no encontrada o no tiene permisos.");

                // Realizamos TODA la actualización en una sola sentencia SQL atómica.
                // Ponemos EsPrincipal = true si el ID coincide, y false si no coincide.
                var filasAfectadas = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId)
                    .ExecuteUpdateAsync(s => s.SetProperty(m => m.EsPrincipal, m => m.Id == imagenId));

                if (filasAfectadas == 0)
                    return Results.NotFound("No se encontró la imagen especificada.");

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
