using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class CompletarTareaFeature
{
    public static void MapCompletarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/tareas/{id:guid}/completar", async (Guid id, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var rowsAffected = await context.Tasks
                .Where(t => t.Id == id && t.AgenteId == agenteId)
                .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.Estado, "Completada"), ct);

            if (rowsAffected > 0)
            {
                // Notificar al servicio de Warming proactivamente
                warmingService.NotifyChange(agenteId);

                // Invalidar caches proactivamente
                await cacheStore.EvictByTagAsync("dashboard-data", ct);
                await cacheStore.EvictByTagAsync("analytics-data", ct);
                var t = await context.Tasks.FindAsync(id);
            if (t != null) {
                if (t.ContactoId.HasValue) await context.Contactos.Where(c => c.Id == t.ContactoId).ExecuteUpdateAsync(s => s.SetProperty(x => x.FechaUltimaActividad, DateTimeOffset.UtcNow), ct);
                if (t.PropiedadId.HasValue) await context.Properties.Where(p => p.Id == t.PropiedadId).ExecuteUpdateAsync(s => s.SetProperty(x => x.FechaUltimaActividad, DateTimeOffset.UtcNow), ct);
            }
            return Results.NoContent();
            }

            return Results.NotFound();
        })
        .WithTags("Tareas")
        .WithName("CompletarTarea");
    }
}
