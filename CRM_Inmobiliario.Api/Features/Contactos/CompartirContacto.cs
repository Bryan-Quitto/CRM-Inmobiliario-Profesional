using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class CompartirContactoFeature
{
    public record Command(Guid[] AgenteIds);

    public static void MapCompartirContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/contactos/{id:guid}/compartir", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
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

            // 2. Filtrar agentes que ya tienen acceso
            var yaCompartidos = await context.ContactoAgenteCompartidos
                .Where(c => c.ContactoId == id && command.AgenteIds.Contains(c.AgenteId))
                .Select(c => c.AgenteId)
                .ToListAsync(ct);

            var nuevosAgentes = command.AgenteIds.Except(yaCompartidos).ToList();

            if (nuevosAgentes.Count == 0)
            {
                return Results.Ok(new { Message = "Los agentes ya tienen acceso o no se proporcionaron nuevos agentes." });
            }

            // 3. Crear registros de compartición
            var comparticiones = nuevosAgentes.Select(agenteId => new ContactoAgenteCompartido
            {
                ContactoId = id,
                AgenteId = agenteId,
                FechaCompartido = DateTimeOffset.UtcNow
            });

            context.ContactoAgenteCompartidos.AddRange(comparticiones);
            await context.SaveChangesAsync(ct);

            // 4. Invalidar caché
            await cacheStore.EvictByTagAsync("contactos", ct);

            return Results.Ok(new { Message = "Contacto compartido exitosamente.", AgentesAgregados = nuevosAgentes.Count });
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("CompartirContacto");
    }
}
