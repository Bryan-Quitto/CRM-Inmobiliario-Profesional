using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class CompletarTareaFeature
{
    public static void MapCompletarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/api/tareas/{id:guid}/completar", async (Guid id, CrmDbContext context) =>
        {
            var tarea = await context.Tasks.FindAsync(id);
            if (tarea is null) return Results.NotFound();

            tarea.Estado = "Completada";
            await context.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithTags("Tareas")
        .WithName("CompletarTarea");
    }
}
