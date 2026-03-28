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
        DateTimeOffset FechaVencimiento,
        string Estado,
        string? ClienteNombre,
        string? PropiedadTitulo);

    public static void MapListarTareasEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/tareas", async (CrmDbContext context) =>
        {
            var tareas = await context.Tasks
                .Include(t => t.Cliente)
                .Include(t => t.Propiedad)
                .OrderBy(t => t.FechaVencimiento)
                .Select(t => new Response(
                    t.Id,
                    t.Titulo,
                    t.Descripcion,
                    t.TipoTarea,
                    t.FechaVencimiento,
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
