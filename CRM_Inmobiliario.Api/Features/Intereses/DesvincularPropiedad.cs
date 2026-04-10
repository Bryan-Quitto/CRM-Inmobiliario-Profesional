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
        app.MapDelete("/clientes/{clienteId:guid}/intereses/{propiedadId:guid}", async (Guid clienteId, Guid propiedadId, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            // Verificar pertenencia del cliente al agente antes de borrar el interés
            var clientePertenece = await context.Leads.AnyAsync(l => l.Id == clienteId && l.AgenteId == agenteId, ct);
            if (!clientePertenece) return Results.NotFound("Cliente no encontrado o no te pertenece.");

            var rowsAffected = await context.LeadPropertyInterests
                .Where(i => i.ClienteId == clienteId && i.PropiedadId == propiedadId)
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
