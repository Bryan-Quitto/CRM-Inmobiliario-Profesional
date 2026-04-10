using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Interacciones;

public static class EliminarInteraccionFeature
{
    public static void MapEliminarInteraccionEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/interacciones/{id:guid}", async (Guid id, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var rowsAffected = await context.Interactions
                .Where(i => i.Id == id && i.AgenteId == agenteId)
                .ExecuteDeleteAsync(ct);

            if (rowsAffected == 0) return Results.NotFound("Interacción no encontrada o no te pertenece.");

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.NoContent();
        })
        .WithTags("Interacciones")
        .WithName("EliminarInteraccion");
    }
}
