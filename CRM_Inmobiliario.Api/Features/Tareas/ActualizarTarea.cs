using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class ActualizarTareaFeature
{
    public record Command(
        string Titulo,
        string? Descripcion,
        string TipoTarea,
        DateTimeOffset FechaVencimiento,
        Guid? ClienteId,
        Guid? PropiedadId);

    public static void MapActualizarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/api/tareas/{id:guid}", async (Guid id, Command command, CrmDbContext context) =>
        {
            var tarea = await context.Tasks.FindAsync(id);
            if (tarea is null) return Results.NotFound();

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

            tarea.Titulo = command.Titulo;
            tarea.Descripcion = command.Descripcion;
            tarea.TipoTarea = command.TipoTarea;
            tarea.FechaVencimiento = command.FechaVencimiento;
            tarea.ClienteId = command.ClienteId;
            tarea.PropiedadId = command.PropiedadId;

            await context.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithTags("Tareas")
        .WithName("ActualizarTarea");
    }
}
