using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.OutputCaching;
using CRM_Inmobiliario.Api.Infrastructure.Validation;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class RegistrarTareaFeature
{
    public record Command(
        string Titulo,
        string? Descripcion,
        string TipoTarea,
        DateTimeOffset FechaInicio,
        int? DuracionMinutos,
        string? ColorHex,
        Guid? ContactoId,
        Guid? PropiedadId,
        string? Lugar);

    public static void MapRegistrarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/tareas", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            // Validar existencia de contacto si se provee y que pertenezca al agente
            if (command.ContactoId.HasValue)
            {
                var contacto = await context.Contactos
                    .FirstOrDefaultAsync(l => l.Id == command.ContactoId.Value && l.AgenteId == agenteId);
                
                if (contacto is null) return Results.BadRequest("El contacto especificado no existe o no te pertenece.");
            }

            // Validar existencia de propiedad si se provee y que pertenezca al agente
            if (command.PropiedadId.HasValue)
            {
                var propiedad = await context.Properties
                    .FirstOrDefaultAsync(p => p.Id == command.PropiedadId.Value && p.AgenteId == agenteId);

                if (propiedad is null) return Results.BadRequest("La propiedad especificada no existe o no te pertenece.");
            }

            // Crear tarea
            var tarea = new TaskItem
            {
                Id = Guid.NewGuid(),
                Titulo = command.Titulo,
                Descripcion = command.Descripcion,
                TipoTarea = command.TipoTarea,
                FechaInicio = command.FechaInicio,
                DuracionMinutos = command.DuracionMinutos ?? 0,
                ColorHex = command.ColorHex,
                ContactoId = command.ContactoId,
                PropiedadId = command.PropiedadId,
                Lugar = command.Lugar,
                Estado = "Pendiente",
                AgenteId = agenteId
            };

            context.Tasks.Add(tarea);
            await context.SaveChangesAsync();
            if (tarea.ContactoId.HasValue) await context.UpsertAgentContactActivityAsync(agenteId, tarea.ContactoId.Value, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);
            if (tarea.PropiedadId.HasValue) await context.UpsertAgentPropertyActivityAsync(agenteId, tarea.PropiedadId.Value, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);

            // Notificar al servicio de Warming proactivamente
            warmingService.NotifyChange(agenteId);

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);
            return Results.Created($"/tareas/{tarea.Id}", new { tarea.Id, tarea.Titulo, tarea.Estado });
        })
        .WithTags("Tareas")
        .WithName("RegistrarTarea")
        .WithValidation<Command>();
    }
}

