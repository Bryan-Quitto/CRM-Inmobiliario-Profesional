using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class RevocarCompartidoFeature
{
    public static void MapRevocarCompartidoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/contactos/{id:guid}/compartir", async (
            [FromRoute] Guid id,
            [FromBody] List<Guid> agenteIds,
            ClaimsPrincipal user,
            CrmDbContext context,
            IOutputCacheStore cacheStore,
            CancellationToken ct) =>
        {
            var currentUserId = user.GetRequiredUserId();

            // 1. Verificar existencia del contacto y que el usuario sea el dueño
            var contacto = await context.Contactos
                .FirstOrDefaultAsync(c => c.Id == id, ct);

            if (contacto == null)
            {
                return Results.NotFound(new { Message = "Contacto no encontrado." });
            }

            if (contacto.AgenteId != currentUserId)
            {
                return Results.Forbid();
            }

            if (await context.AgentArchivedContacts.AnyAsync(a => a.AgentId == currentUserId && a.ContactoId == id, ct))
            {
                return Results.Forbid();
            }

            if (agenteIds == null || agenteIds.Count == 0)
            {
                return Results.BadRequest(new { Message = "Debe proporcionar al menos un ID de agente." });
            }

            // 2. Eliminar las relaciones de compartición
            var deletedRows = await context.ContactoAgenteCompartidos
                .Where(c => c.ContactoId == id && agenteIds.Contains(c.AgenteId))
                .ExecuteDeleteAsync(ct);

            if (deletedRows == 0)
            {
                return Results.NotFound(new { Message = "No se encontraron relaciones de compartición para los agentes especificados." });
            }

            // 3. Invalidar caché
            await cacheStore.EvictByTagAsync("contactos", ct);

            return Results.Ok(new { Message = "Visibilidad revocada exitosamente.", RegistrosEliminados = deletedRows });
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("RevocarCompartido");
    }
}
