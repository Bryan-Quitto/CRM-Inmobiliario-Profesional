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

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class RegistrarTareaFeature
{
    public record Command(
        string Titulo,
        string? Descripcion,
        string TipoTarea,
        DateTimeOffset FechaInicio,
        Guid? ContactoId,
        Guid? PropiedadId,
        string? Lugar);

    public static void MapRegistrarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/tareas", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            // LOG DE AUDITORIA API
            Console.WriteLine($"[API] Registrando Tarea: '{command.Titulo}' | Recibido (UTC/Offset): {command.FechaInicio:yyyy-MM-dd HH:mm:ss K} | Local Servidor: {command.FechaInicio.LocalDateTime:yyyy-MM-dd HH:mm:ss}");

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
                DuracionMinutos = 30, // Default para registros rápidos de tareas
                ContactoId = command.ContactoId,
                PropiedadId = command.PropiedadId,
                Lugar = command.Lugar,
                Estado = "Pendiente",
                AgenteId = agenteId
            };

            context.Tasks.Add(tarea);
            await context.SaveChangesAsync();

            // Notificar al servicio de Warming proactivamente
            warmingService.NotifyChange(agenteId);

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.Created($"/tareas/{tarea.Id}", new { tarea.Id, tarea.Titulo, tarea.Estado });
        })
        .WithTags("Tareas")
        .WithName("RegistrarTarea");
    }
}
