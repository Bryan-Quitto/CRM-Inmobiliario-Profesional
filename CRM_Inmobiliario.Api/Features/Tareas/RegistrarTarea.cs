using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class RegistrarTareaFeature
{
    public record Command(
        string Titulo,
        string? Descripcion,
        string TipoTarea,
        DateTimeOffset FechaVencimiento,
        Guid? ClienteId,
        Guid? PropiedadId);

    public static void MapRegistrarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/tareas", async (Command command, CrmDbContext context) =>
        {
            // Validar existencia de cliente si se provee
            if (command.ClienteId.HasValue)
            {
                var cliente = await context.Leads.FindAsync(command.ClienteId.Value);
                if (cliente is null) return Results.BadRequest("El cliente especificado no existe.");
            }

            // Validar existencia de propiedad si se provee
            if (command.PropiedadId.HasValue)
            {
                var propiedad = await context.Properties.FindAsync(command.PropiedadId.Value);
                if (propiedad is null) return Results.BadRequest("La propiedad especificada no existe.");
            }

            // Crear tarea
            var tarea = new TaskItem
            {
                Id = Guid.NewGuid(),
                Titulo = command.Titulo,
                Descripcion = command.Descripcion,
                TipoTarea = command.TipoTarea,
                FechaVencimiento = command.FechaVencimiento,
                ClienteId = command.ClienteId,
                PropiedadId = command.PropiedadId,
                Estado = "Pendiente",
                // Por ahora asignamos null para AgenteId ya que el modelo ahora es opcional
                // Para este MVP, asumiremos que el agente se manejará después de la autenticación
                AgenteId = null 
            };

            context.Tasks.Add(tarea);
            await context.SaveChangesAsync();

            return Results.Created($"/api/tareas/{tarea.Id}", tarea);
        })
        .WithTags("Tareas")
        .WithName("RegistrarTarea");
    }
}
