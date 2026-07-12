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
        DateTimeOffset FechaInicio,
        int DuracionMinutos,
        string? ColorHex,
        string Estado,
        bool EsVencida,
        string? ContactoNombre,
        string? PropiedadTitulo,
        Guid? ContactoId,
        Guid? PropiedadId,
        string? Lugar,
        string? PropiedadDireccion,
        string? PropiedadImagenPortadaUrl);

    public static RouteHandlerBuilder MapObtenerTareaPorIdEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/tareas/{id:guid}", async (Guid id, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var ecOffset = TimeSpan.FromHours(-5);
            var nowEc = DateTimeOffset.UtcNow.ToOffset(ecOffset);

            var tarea = await context.Tasks
                .AsNoTracking()
                .Include(t => t.Contacto)
                .Include(t => t.Propiedad)
                    .ThenInclude(p => p!.Media)
                .FirstOrDefaultAsync(t => t.Id == id && t.AgenteId == agenteId);

            if (tarea is null) return Results.NotFound();

            var response = new TareaDetalleResponse(
                tarea.Id,
                tarea.Titulo,
                tarea.Descripcion,
                tarea.TipoTarea,
                tarea.FechaInicio,
                tarea.DuracionMinutos,
                tarea.ColorHex,
                tarea.Estado,
                tarea.Estado == "Pendiente" && tarea.FechaInicio.AddMinutes(tarea.DuracionMinutos) < nowEc,
                tarea.Contacto != null ? $"{tarea.Contacto.Nombre} {tarea.Contacto.Apellido}" : null,
                tarea.Propiedad?.Titulo,
                tarea.ContactoId,
                tarea.PropiedadId,
                tarea.Lugar,
                tarea.Propiedad?.Direccion,
                tarea.Propiedad?.Media.Where(m => m.EsPrincipal).Select(m => m.UrlPublica).FirstOrDefault()
            );

            return Results.Ok(response);
        })
        .WithTags("Tareas")
        .WithName("ObtenerTareaPorId");
    }
}
