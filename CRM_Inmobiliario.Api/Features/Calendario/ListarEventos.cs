using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Calendario;

public static class ListarEventosFeature
{
    public record EventoCalendarioResponse(
        Guid Id,
        string Titulo,
        string? Descripcion,
        string TipoTarea,
        DateTimeOffset FechaInicio,
        int DuracionMinutos,
        string? ColorHex,
        string Estado,
        Guid? ContactoId,
        string? ContactoNombre,
        Guid? PropiedadId,
        string? PropiedadTitulo);

    public static RouteHandlerBuilder MapListarEventosEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/calendario", async (DateTimeOffset inicio, DateTimeOffset fin, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            // Normalizar a UTC para evitar error de Npgsql con offsets distintos de cero
            var inicioUtc = inicio.ToUniversalTime();
            var finUtc = fin.ToUniversalTime();

            var eventos = await context.Tasks
                .AsNoTracking()
                .Include(t => t.Contacto)
                .Include(t => t.Propiedad)
                .Where(t => t.AgenteId == agenteId && 
                            t.FechaInicio >= inicioUtc && 
                            t.FechaInicio <= finUtc)
                .Select(t => new EventoCalendarioResponse(
                    t.Id,
                    t.Titulo,
                    t.Descripcion,
                    t.TipoTarea,
                    t.FechaInicio,
                    t.DuracionMinutos,
                    t.ColorHex,
                    t.Estado,
                    t.ContactoId,
                    t.Contacto != null ? $"{t.Contacto.Nombre} {t.Contacto.Apellido}" : null,
                    t.PropiedadId,
                    t.Propiedad != null ? t.Propiedad.Titulo : null
                ))
                .ToListAsync();

            return Results.Ok(eventos);
        })
        .WithTags("Calendario")
        .WithName("ListarEventos");
    }
}
