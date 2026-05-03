using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class ListarContactosFeature
{
    public record ContactoResponse(
        Guid Id,
        string Nombre,
        string? Apellido,
        string? Email,
        string Telefono,
        string Origen,
        string EtapaEmbudo,
        string EstadoPropietario,
        bool EsContacto,
        bool EsPropietario,
        DateTimeOffset FechaCreacion);

    public static RouteHandlerBuilder MapListarContactosEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/contactos", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var contactos = await context.Contactos
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId)
                .OrderByDescending(l => l.FechaCreacion)
                .Select(l => new ContactoResponse(
                    l.Id,
                    l.Nombre,
                    l.Apellido,
                    l.Email,
                    l.Telefono,
                    l.Origen,
                    l.EtapaEmbudo,
                    l.EstadoPropietario,
                    l.EsProspecto,
                    l.EsPropietario,
                    l.FechaCreacion))
                .ToListAsync();

            return Results.Ok(contactos);
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ListarContactos");
    }
}
