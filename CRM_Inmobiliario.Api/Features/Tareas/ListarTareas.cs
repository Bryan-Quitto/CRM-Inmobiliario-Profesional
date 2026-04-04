using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Tareas;

public static class ListarTareasFeature
{
    public record Response(
        Guid Id,
        string Titulo,
        string? Descripcion,
        string TipoTarea,
        DateTimeOffset FechaInicio,
        int DuracionMinutos,
        string? ColorHex,
        string Estado,
        string? ClienteNombre,
        string? PropiedadTitulo);

    public static RouteHandlerBuilder MapListarTareasEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/tareas", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var tareas = await context.Tasks
                .Include(t => t.Cliente)
                .Include(t => t.Propiedad)
                .Where(t => t.AgenteId == agenteId)
                .OrderBy(t => t.FechaInicio)
                .Select(t => new Response(
                    t.Id,
                    t.Titulo,
                    t.Descripcion,
                    t.TipoTarea,
                    t.FechaInicio,
                    t.DuracionMinutos,
                    t.ColorHex,
                    t.Estado,
                    t.Cliente != null ? $"{t.Cliente.Nombre} {t.Cliente.Apellido}".Trim() : null,
                    t.Propiedad != null ? t.Propiedad.Titulo : null))
                .ToListAsync();

            return Results.Ok(tareas);
        })
        .WithTags("Tareas")
        .WithName("ListarTareas");
    }
}
