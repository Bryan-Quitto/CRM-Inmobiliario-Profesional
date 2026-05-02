using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Intereses;

public static class DesvincularPropiedadFeature
{
    public static void MapDesvincularPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/contactos/{contactoId:guid}/intereses/{propiedadId:guid}", async (Guid contactoId, Guid propiedadId, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            // Verificar pertenencia del contacto al agente antes de borrar el interés
            var contactoPertenece = await context.Contactos.AnyAsync(l => l.Id == contactoId && l.AgenteId == agenteId, ct);
            if (!contactoPertenece) return Results.NotFound("Contacto no encontrado o no te pertenece.");

            var rowsAffected = await context.ContactoInteresPropiedades
                .Where(i => i.ContactoId == contactoId && i.PropiedadId == propiedadId)
                .ExecuteDeleteAsync(ct);

            if (rowsAffected > 0)
            {
                // Invalidar caches proactivamente
                await cacheStore.EvictByTagAsync("dashboard-data", ct);
                await cacheStore.EvictByTagAsync("analytics-data", ct);
                return Results.NoContent();
            }

            return Results.NotFound("Relación no encontrada.");
        })
        .WithTags("Intereses")
        .WithName("DesvincularPropiedad");
    }
}
