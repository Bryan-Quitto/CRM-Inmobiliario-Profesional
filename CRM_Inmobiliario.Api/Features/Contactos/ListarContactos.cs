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
        DateTimeOffset FechaCreacion,
        bool EsCompartido,
        string? NombreAgenteDueno,
        int NumeroInteracciones,
        int NumeroIntereses,
        int NumeroPropiedadesCaptadas,
        int NumeroReservas,
        int NumeroCierres,
        bool BotActivo,
        string? EstadoIA);

    public static RouteHandlerBuilder MapListarContactosEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/contactos", async (int? pageNumber, int? pageSize, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var actualPageNumber = pageNumber ?? 1;
            var actualPageSize = pageSize ?? 50;
            var agenteId = user.GetRequiredUserId();

            var baseQuery = context.Contactos
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId || l.CompartidoCon.Any(c => c.AgenteId == agenteId));

            var totalCount = await baseQuery.CountAsync();

            var contactos = await baseQuery
                .OrderByDescending(l => l.FechaCreacion)
                .Skip((actualPageNumber - 1) * actualPageSize)
                .Take(actualPageSize)
                .Select(l => new ContactoResponse(
                    l.Id,
                    l.Nombre,
                    l.Apellido,
                    l.AgenteId == agenteId ? l.Email : "oculto@privado.com",
                    l.AgenteId == agenteId ? l.Telefono : "***-***-****",
                    l.Origen,
                    l.EtapaEmbudo,
                    l.EstadoPropietario,
                    l.EsProspecto,
                    l.EsPropietario,
                    l.FechaCreacion,
                    l.AgenteId != agenteId,
                    l.AgenteId != agenteId ? $"{l.Agente!.Nombre} {l.Agente.Apellido}" : null,
                    l.Interactions.Count,
                    l.PropertyInterests.Count,
                    l.PropertiesOwned.Count,
                    context.Properties.Count(p => p.CerradoConId == l.Id && p.EstadoComercial == "Reservada"),
                    context.Properties.Count(p => p.CerradoConId == l.Id && (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada")),
                    l.BotActivo,
                    l.EstadoIA))
                .ToListAsync();

            return Results.Ok(new 
            {
                Items = contactos,
                TotalCount = totalCount,
                PageNumber = actualPageNumber,
                PageSize = actualPageSize
            });
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ListarContactos");
    }
}
