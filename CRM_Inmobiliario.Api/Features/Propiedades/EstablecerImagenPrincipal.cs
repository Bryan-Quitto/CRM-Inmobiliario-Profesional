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
            CrmDbContext context,
            CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            try
            {
                // Verificar que el usuario tiene permisos de gestión sobre la propiedad
                var propiedad = await context.Properties
                    .Include(p => p.Agente)
                    .Include(p => p.Transactions)
                    .FirstOrDefaultAsync(p => p.Id == propiedadId);

                if (propiedad == null)
                    return Results.NotFound("Propiedad no encontrada.");

                if (!PropertyPermissionsHelper.CanManage(propiedad, agenteId))
                    return Results.Json(new { Message = "No tienes permisos para modificar esta propiedad." }, statusCode: StatusCodes.Status403Forbidden);

                // Realizamos TODA la actualización en una sola sentencia SQL atómica.                // Ponemos EsPrincipal = true si el ID coincide, y false si no coincide.
                var filasAfectadas = await context.PropertyMedia
                    .Where(m => m.PropiedadId == propiedadId)
                    .ExecuteUpdateAsync(s => s.SetProperty(m => m.EsPrincipal, m => m.Id == imagenId));

                if (filasAfectadas == 0)
                    return Results.NotFound("No se encontró la imagen especificada.");

                await context.UpsertAgentPropertyActivityAsync(agenteId, propiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);

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

