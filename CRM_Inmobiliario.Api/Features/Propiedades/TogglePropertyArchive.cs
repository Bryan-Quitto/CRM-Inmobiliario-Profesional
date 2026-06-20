using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class TogglePropertyArchiveFeature
{
    public static void MapTogglePropertyArchiveEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/propiedades/{id:guid}/toggle-archive", async (Guid id, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var propiedad = await context.Properties
                .FirstOrDefaultAsync(p => p.Id == id && (p.AgenteId == agenteId || p.Transactions.Any(t => t.CreatedById == agenteId)), ct);

            if (propiedad == null)
            {
                return Results.NotFound();
            }

            var archiveRecord = await context.AgentArchivedProperties
                .FirstOrDefaultAsync(a => a.AgentId == agenteId && a.PropiedadId == id, ct);

            if (archiveRecord != null)
            {
                // Desarchivar
                context.AgentArchivedProperties.Remove(archiveRecord);
            }
            else
            {
                // Archivar
                context.AgentArchivedProperties.Add(new AgentArchivedProperty
                {
                    AgentId = agenteId,
                    PropiedadId = id,
                    ArchivedAt = DateTimeOffset.UtcNow
                });
            }

            await context.SaveChangesAsync(ct);
            
            await cacheStore.EvictByTagAsync("properties-data", ct);
            await cacheStore.EvictByTagAsync("dashboard-data", ct);

            return Results.Ok(new { IsArchived = archiveRecord == null });
        })
        .RequireAuthorization()
        .WithTags("Propiedades")
        .WithName("TogglePropertyArchive");
    }
}
