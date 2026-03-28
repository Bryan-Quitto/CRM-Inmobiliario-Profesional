using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class CancelarTareaFeature
{
    public static void MapCancelarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/tareas/{id:guid}/cancelar", async (Guid id, CrmDbContext context) =>
        {
            var tarea = await context.Tasks.FindAsync(id);
            if (tarea is null) return Results.NotFound();

            tarea.Estado = "Cancelada";
            await context.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithTags("Tareas")
        .WithName("CancelarTarea");
    }
}
