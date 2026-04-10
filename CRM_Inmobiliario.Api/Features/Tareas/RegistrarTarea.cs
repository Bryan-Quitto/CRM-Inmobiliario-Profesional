using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
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
        Guid? ClienteId,
        Guid? PropiedadId,
        string? Lugar);

    public static void MapRegistrarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/tareas", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();

            // LOG DE AUDITORIA API
            Console.WriteLine($"[API] Registrando Tarea: '{command.Titulo}' | Recibido (UTC/Offset): {command.FechaInicio:yyyy-MM-dd HH:mm:ss K} | Local Servidor: {command.FechaInicio.LocalDateTime:yyyy-MM-dd HH:mm:ss}");

            // Validar existencia de cliente si se provee y que pertenezca al agente
            if (command.ClienteId.HasValue)
            {
                var cliente = await context.Leads
                    .FirstOrDefaultAsync(l => l.Id == command.ClienteId.Value && l.AgenteId == agenteId);
                
                if (cliente is null) return Results.BadRequest("El cliente especificado no existe o no te pertenece.");
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
                ClienteId = command.ClienteId,
                PropiedadId = command.PropiedadId,
                Lugar = command.Lugar,
                Estado = "Pendiente",
                AgenteId = agenteId
            };

            context.Tasks.Add(tarea);
            await context.SaveChangesAsync();

            // Invalidar caches proactivamente
            await cacheStore.EvictByTagAsync("dashboard-data", ct);
            await cacheStore.EvictByTagAsync("analytics-data", ct);

            return Results.Created($"/tareas/{tarea.Id}", new { tarea.Id, tarea.Titulo, tarea.Estado });
        })
        .WithTags("Tareas")
        .WithName("RegistrarTarea");
    }
}
