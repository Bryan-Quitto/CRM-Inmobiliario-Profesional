using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;

using CRM_Inmobiliario.Api.Infrastructure.Caching;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class ListarContactosFeature
{
    public record ContactoResponse(
        Guid Id,
        string Nombre,
        string? Apellido,
        string? Email,
        string? Telefono,
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
        return app.MapGet("/contactos", async ([AsParameters] GetContactosRequest request, ClaimsPrincipal user, CrmDbContext context, IServiceProvider serviceProvider, CancellationToken cancellationToken) =>
        {
            var sw = Stopwatch.StartNew();
            var agenteId = user.GetRequiredUserId();

            var propios = context.Contactos.Where(l => l.AgenteId == agenteId);
            var compartidos = context.Contactos.Where(l => l.CompartidoCon.Any(c => c.AgenteId == agenteId));
            
            // Usar Concat (UNION ALL) en lugar de OR/EXISTS para forzar Index Scan en Postgres
            var baseQuery = propios.Concat(compartidos).AsNoTracking();

            if (!string.IsNullOrEmpty(request.Search))
            {
                var searchPattern = $"%{CrmDbContext.NormalizeText(request.Search)}%";
                baseQuery = baseQuery.Where(c => EF.Functions.ILike(c.NormalizedSearchText, searchPattern));
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

            var countsCacheKey = $"Contactos_Counts_{agenteId}_{request.Search}_{request.Estado}_{request.Segmento}_{request.Visibilidad}_{request.Origen}_{request.EstadoPropietario}";
            
            var counts = await serviceProvider.GetRequiredService<Microsoft.Extensions.Caching.Memory.IMemoryCache>().GetOrCreateAsync(countsCacheKey, async entry => 
            {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5);
                var swCount = Stopwatch.StartNew();
                // Implementación The One Trip Pattern: Consolidar conteos en un solo viaje
                var result = await baseQuery
                    .GroupBy(c => 1)
                    .Select(g => new {
                        TotalCount = g.Count(),
                        NuevosCount = g.Count(c => c.EtapaEmbudo == "Nuevo"),
                        EnNegociacionCount = g.Count(c => c.EtapaEmbudo == "En Negociacion")
                    })
                    .FirstOrDefaultAsync(cancellationToken) ?? new { TotalCount = 0, NuevosCount = 0, EnNegociacionCount = 0 };
                swCount.Stop();
                Console.WriteLine($"[API] Calculó Counts en {swCount.ElapsedMilliseconds}ms (Caché Miss)");
                return result;
            });

            var totalCount = counts!.TotalCount;
            var nuevosCount = counts.NuevosCount;
            var enNegociacionCount = counts.EnNegociacionCount;

            IQueryable<Contacto> orderedQuery = sortBy switch
            {
                "nombre" => isDesc ? baseQuery.OrderByDescending(l => l.Nombre).ThenByDescending(l => l.Id) : baseQuery.OrderBy(l => l.Nombre).ThenBy(l => l.Id),
                "intereses" => isDesc ? baseQuery.OrderByDescending(l => l.NumeroIntereses).ThenByDescending(l => l.Id) : baseQuery.OrderBy(l => l.NumeroIntereses).ThenBy(l => l.Id),
                "propiedades" => isDesc ? baseQuery.OrderByDescending(l => l.NumeroPropiedadesCaptadas).ThenByDescending(l => l.Id) : baseQuery.OrderBy(l => l.NumeroPropiedadesCaptadas).ThenBy(l => l.Id),
                "interacciones" => isDesc ? baseQuery.OrderByDescending(l => l.NumeroInteracciones).ThenByDescending(l => l.Id) : baseQuery.OrderBy(l => l.NumeroInteracciones).ThenBy(l => l.Id),
                _ => isDesc ? baseQuery.OrderByDescending(l => l.FechaCreacion).ThenByDescending(l => l.Id) : baseQuery.OrderBy(l => l.FechaCreacion).ThenBy(l => l.Id)
            };

            var items = await orderedQuery
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
                    l.NumeroInteracciones,
                    l.NumeroIntereses,
                    l.NumeroPropiedadesCaptadas,
                    l.NumeroReservas,
                    l.NumeroCierres
                ))
                .ToListAsync(cancellationToken);

            sw.Stop();
            Console.WriteLine($"[API] ListarContactos (Backend) tardó {sw.ElapsedMilliseconds} ms (Con Datos) para página {request.Page}");

            var result = new GetContactosResponse(items, totalCount, nuevosCount, enNegociacionCount);
            return Results.Ok(result);
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ListarContactos")
        .CacheOutput(policy => policy
            .AddPolicy<AuthenticatedOutputCachePolicy>()
            .Expire(TimeSpan.FromHours(1))
            .Tag("contactos"));
    }
}
