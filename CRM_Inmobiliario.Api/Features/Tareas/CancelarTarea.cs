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

public static class CancelarTareaFeature
{
    public static void MapCancelarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/tareas/{id:guid}/cancelar", async (Guid id, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var tarea = await context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.AgenteId == agenteId);

            if (tarea is null) return Results.NotFound();

            tarea.Estado = "Cancelada";
            await context.SaveChangesAsync();

            // Notificar al servicio de Warming proactivamente
            warmingService.NotifyChange(agenteId);

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.NoContent();
        })
        .WithTags("Tareas")
        .WithName("CancelarTarea");
    }
}
