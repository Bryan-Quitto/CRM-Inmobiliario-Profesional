using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class ObtenerAgentesCompartidosFeature
{
    public record SharedAgentDto(Guid Id, string NombreCompleto, string? FotoUrl);

    public static void MapObtenerAgentesCompartidosEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/contactos/{id:guid}/compartir", async (Guid id, ClaimsPrincipal user, CrmDbContext context, CancellationToken ct) =>
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

            // 2. Obtener la lista de agentes con los que se ha compartido
            var agentes = await context.ContactoAgenteCompartidos
                .Where(c => c.ContactoId == id)
                .Select(c => new SharedAgentDto(
                    c.AgenteId,
                    $"{c.Agente!.Nombre} {c.Agente.Apellido}",
                    c.Agente.FotoUrl))
                .ToListAsync(ct);

            return Results.Ok(agentes);
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ObtenerAgentesCompartidos");
    }
}
