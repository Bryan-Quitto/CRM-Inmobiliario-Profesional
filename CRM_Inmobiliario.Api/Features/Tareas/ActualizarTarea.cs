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

public static class ActualizarTareaFeature
{
    public record Command(
        string Titulo,
        string? Descripcion,
        string TipoTarea,
        DateTimeOffset FechaInicio,
        int DuracionMinutos,
        string? ColorHex,
        Guid? ClienteId,
        Guid? PropiedadId,
        string? Lugar);

    public static void MapActualizarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/tareas/{id:guid}", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            var tarea = await context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.AgenteId == agenteId);
            
            if (tarea is null) return Results.NotFound();

            // Validar existencia de cliente si se provee y que pertenezca al agente
            if (command.ClienteId.HasValue)
            {
                var cliente = await context.Leads
                    .AnyAsync(l => l.Id == command.ClienteId.Value && l.AgenteId == agenteId);
                if (!cliente) return Results.BadRequest("El cliente especificado no existe o no te pertenece.");
            }

            // Validar existencia de propiedad si se provee y que pertenezca al agente
            if (command.PropiedadId.HasValue)
            {
                var propiedad = await context.Properties
                    .AnyAsync(p => p.Id == command.PropiedadId.Value && p.AgenteId == agenteId);
                if (!propiedad) return Results.BadRequest("La propiedad especificada no existe o no te pertenece.");
            }

            tarea.Titulo = command.Titulo;
            tarea.Descripcion = command.Descripcion;
            tarea.TipoTarea = command.TipoTarea;
            tarea.FechaInicio = command.FechaInicio;
            tarea.DuracionMinutos = command.DuracionMinutos;
            tarea.ColorHex = command.ColorHex;
            tarea.ClienteId = command.ClienteId;
            tarea.PropiedadId = command.PropiedadId;
            tarea.Lugar = command.Lugar;

            await context.SaveChangesAsync();

            // Notificar al servicio de Warming proactivamente
            warmingService.NotifyChange(agenteId);

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.NoContent();
        })
        .WithTags("Tareas")
        .WithName("ActualizarTarea");
    }
}
