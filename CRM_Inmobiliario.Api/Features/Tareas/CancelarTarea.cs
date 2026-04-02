using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class CancelarTareaFeature
{
    public static void MapCancelarTareaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/tareas/{id:guid}/cancelar", async (Guid id, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var tarea = await context.Tasks
                .FirstOrDefaultAsync(t => t.Id == id && t.AgenteId == agenteId);

            if (tarea is null) return Results.NotFound();

            tarea.Estado = "Cancelada";
            await context.SaveChangesAsync();

            return Results.NoContent();
        })
        .WithTags("Tareas")
        .WithName("CancelarTarea");
    }
}
