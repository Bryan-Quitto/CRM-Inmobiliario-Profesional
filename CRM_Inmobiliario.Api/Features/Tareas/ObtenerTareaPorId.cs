using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class ObtenerTareaPorIdFeature
{
    public record TareaDetalleResponse(
        Guid Id,
        string Titulo,
        string? Descripcion,
        string TipoTarea,
        DateTimeOffset FechaVencimiento,
        string Estado,
        string? ClienteNombre,
        string? PropiedadTitulo,
        Guid? ClienteId,
        Guid? PropiedadId);

    public static void MapObtenerTareaPorIdEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/tareas/{id:guid}", async (Guid id, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var tarea = await context.Tasks
                .Include(t => t.Cliente)
                .Include(t => t.Propiedad)
                .FirstOrDefaultAsync(t => t.Id == id && t.AgenteId == agenteId);

            if (tarea is null) return Results.NotFound();

            var response = new TareaDetalleResponse(
                tarea.Id,
                tarea.Titulo,
                tarea.Descripcion,
                tarea.TipoTarea,
                tarea.FechaVencimiento,
                tarea.Estado,
                tarea.Cliente != null ? $"{tarea.Cliente.Nombre} {tarea.Cliente.Apellido}" : null,
                tarea.Propiedad?.Titulo,
                tarea.ClienteId,
                tarea.PropiedadId
            );

            return Results.Ok(response);
        })
        .WithTags("Tareas")
        .WithName("ObtenerTareaPorId");
    }
}
