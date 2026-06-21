using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class ToggleContactArchiveFeature
{
    public static void MapToggleContactArchiveEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/contactos/{id:guid}/toggle-archive", async (Guid id, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var contacto = await context.Contactos
                .FirstOrDefaultAsync(l => l.Id == id && (l.AgenteId == agenteId || l.CompartidoCon.Any(c => c.AgenteId == agenteId)), ct);

            if (contacto == null)
            {
                return Results.NotFound();
            }

            var archiveRecord = await context.AgentArchivedContacts
                .FirstOrDefaultAsync(a => a.AgentId == agenteId && a.ContactoId == id, ct);

            if (archiveRecord != null)
            {
                // Desarchivar
                context.AgentArchivedContacts.Remove(archiveRecord);
                contacto.BotActivoWA = true;
                contacto.BotActivoFB = true;
            }
            else
            {
                // Archivar
                context.AgentArchivedContacts.Add(new AgentArchivedContact
                {
                    AgentId = agenteId,
                    ContactoId = id,
                    ArchivedAt = DateTimeOffset.UtcNow
                });
                contacto.BotActivoWA = false;
                contacto.BotActivoFB = false;
            }
            await context.SaveChangesAsync(ct);
            await context.UpsertAgentContactActivityAsync(user.GetRequiredUserId(), id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);
            
            await cacheStore.EvictByTagAsync("contactos", ct);
            await cacheStore.EvictByTagAsync("dashboard-data", ct);

            return Results.Ok(new { IsArchived = archiveRecord == null });
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ToggleContactArchive");
    }
}

