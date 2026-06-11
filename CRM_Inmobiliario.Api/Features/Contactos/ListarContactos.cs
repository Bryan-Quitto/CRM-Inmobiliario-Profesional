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
        int NumeroCierres);

    public record GetContactosRequest(
        int Page = 1,
        int PageSize = 20,
        string? Search = null,
        string? Estado = null,
        string? Segmento = null,
        string? Visibilidad = null,
        string? Origen = null,
        string? EstadoPropietario = null,
        string? SortBy = null,
        string? SortDirection = null);

    public record GetContactosResponse(
        List<ContactoResponse> Items,
        int TotalCount,
        int Nuevos,
        int EnNegociacion);

    public static RouteHandlerBuilder MapListarContactosEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/contactos", async ([AsParameters] GetContactosRequest request, ClaimsPrincipal user, CrmDbContext context, CancellationToken cancellationToken) =>
        {
            var agenteId = user.GetRequiredUserId();

            var baseQuery = context.Contactos
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId || l.CompartidoCon.Any(c => c.AgenteId == agenteId));

            if (!string.IsNullOrEmpty(request.Search))
            {
                var searchPattern = $"%{request.Search}%";
                baseQuery = baseQuery.Where(c => EF.Functions.ILike(
                    EF.Functions.Unaccent(c.Nombre + " " + (c.Apellido ?? "")), 
                    EF.Functions.Unaccent(searchPattern)));
            }

            if (!string.IsNullOrEmpty(request.Estado))
            {
                baseQuery = baseQuery.Where(c => c.EtapaEmbudo == request.Estado);
            }

            if (!string.IsNullOrEmpty(request.Segmento) && request.Segmento != "Todos")
            {
                if (request.Segmento.Equals("clientes", StringComparison.OrdinalIgnoreCase))
                    baseQuery = baseQuery.Where(c => c.EsProspecto);
                else if (request.Segmento.Equals("propietarios", StringComparison.OrdinalIgnoreCase))
                    baseQuery = baseQuery.Where(c => c.EsPropietario);
            }

            if (!string.IsNullOrEmpty(request.Visibilidad) && request.Visibilidad != "Todos")
            {
                if (request.Visibilidad.Equals("Propios", StringComparison.OrdinalIgnoreCase))
                    baseQuery = baseQuery.Where(c => c.AgenteId == agenteId);
                else if (request.Visibilidad.Equals("Compartidos", StringComparison.OrdinalIgnoreCase))
                    baseQuery = baseQuery.Where(c => c.AgenteId != agenteId);
            }

            if (!string.IsNullOrEmpty(request.Origen) && request.Origen != "Todos")
            {
                baseQuery = baseQuery.Where(c => c.Origen == request.Origen);
            }

            if (!string.IsNullOrEmpty(request.EstadoPropietario) && request.EstadoPropietario != "Todos")
            {
                baseQuery = baseQuery.Where(c => c.EstadoPropietario == request.EstadoPropietario);
            }

            var sortBy = request.SortBy?.ToLower() ?? "fechacreacion";
            var isDesc = request.SortDirection != "asc";

            var resultList = await baseQuery
                .GroupBy(x => 1)
                .Select(g => new GetContactosResponse(
                    (sortBy == "nombre" ? (isDesc ? g.OrderByDescending(l => l.Nombre).ThenByDescending(l => l.Id) : g.OrderBy(l => l.Nombre).ThenBy(l => l.Id)) :
                     sortBy == "intereses" ? (isDesc ? g.OrderByDescending(l => l.PropertyInterests.Count).ThenByDescending(l => l.Id) : g.OrderBy(l => l.PropertyInterests.Count).ThenBy(l => l.Id)) :
                     sortBy == "propiedades" ? (isDesc ? g.OrderByDescending(l => l.PropertiesOwned.Count).ThenByDescending(l => l.Id) : g.OrderBy(l => l.PropertiesOwned.Count).ThenBy(l => l.Id)) :
                     sortBy == "interacciones" ? (isDesc ? g.OrderByDescending(l => l.Interactions.Count).ThenByDescending(l => l.Id) : g.OrderBy(l => l.Interactions.Count).ThenBy(l => l.Id)) :
                     (isDesc ? g.OrderByDescending(l => l.FechaCreacion).ThenByDescending(l => l.Id) : g.OrderBy(l => l.FechaCreacion).ThenBy(l => l.Id)))
                     .Skip((request.Page - 1) * request.PageSize)
                     .Take(request.PageSize)
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
                         l.PropertiesClosed.Count(p => p.EstadoComercial == "Reservada"),
                         l.PropertiesClosed.Count(p => p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada")))
                     .ToList(),
                    g.Count(),
                    g.Count(c => c.EtapaEmbudo == "Nuevo"),
                    g.Count(c => c.EtapaEmbudo == "En Negociacion")
                )).ToListAsync(cancellationToken);

            var result = resultList.FirstOrDefault();

            if (result == null)
            {
                return Results.Ok(new GetContactosResponse(new List<ContactoResponse>(), 0, 0, 0));
            }

            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ListarContactos");
    }
}
