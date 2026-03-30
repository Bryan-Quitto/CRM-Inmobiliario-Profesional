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
            var rowsAffected = await context.Tasks
                .Where(t => t.Id == id)
                .ExecuteUpdateAsync(setters => setters.SetProperty(t => t.Estado, "Completada"));

            return rowsAffected > 0 ? Results.NoContent() : Results.NotFound();
        })
        .WithTags("Tareas")
        .WithName("CompletarTarea");
    }
}
