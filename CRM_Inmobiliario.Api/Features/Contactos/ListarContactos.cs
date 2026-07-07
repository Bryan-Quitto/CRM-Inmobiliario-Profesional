using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;

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
        string EstadoEmbudo,
        string EstadoPropietario,
        bool EsCliente,
        bool EsPropietario,
        DateTimeOffset FechaCreacion,
        bool EsCompartido,
        string? NombreAgenteDueno,
        int NumeroInteracciones,
        int NumeroIntereses,
        int NumeroPropiedadesCaptadas,
        int NumeroReservas,
        int NumeroCierres,
        bool BotActivoWA,
        bool BotActivoFB,
        string? EstadoIA_WA,
        string? EstadoIA_FB,
        bool IsArchivedForCurrentUser);

    public record GetContactosRequest(
        int Page = 1,
        int PageSize = 20,
        string? Search = null,
        string? Estado = null,
        string? Segmento = null,
        string? Visibilidad = null,
        string? Origen = null,
        string? EstadoPropietario = null,
        string? EstadoIA_WA = null,
        string? EstadoIA_FB = null,
        string? SortBy = null,
        string? SortDirection = null,
        bool IsArchived = false);

    public record GetContactosResponse(
        List<ContactoResponse> Items,
        int TotalCount,
        int Nuevos,
        int EnNegociacion);

    // Semáforos por clave para evitar Cache Stampede: garantiza un solo writer por cache key
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _countLocks = new();

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

            var archivedQuery = context.AgentArchivedContacts.Where(a => a.AgentId == agenteId);

            if (request.IsArchived)
            {
                baseQuery = baseQuery.Where(c => archivedQuery.Any(a => a.ContactoId == c.Id));
            }
            else
            {
                baseQuery = baseQuery.Where(c => !archivedQuery.Any(a => a.ContactoId == c.Id));
            }

            if (!string.IsNullOrEmpty(request.Search))
            {
                var searchPattern = $"%{CrmDbContext.NormalizeText(request.Search)}%";
                baseQuery = baseQuery.Where(c => EF.Functions.ILike(c.NormalizedSearchText, searchPattern));
            }

            if (!string.IsNullOrEmpty(request.Estado))
            {
                baseQuery = baseQuery.Where(c => c.EstadoEmbudo == request.Estado);
            }

            if (!string.IsNullOrEmpty(request.Segmento) && request.Segmento != "Todos")
            {
                if (request.Segmento.Equals("clientes", StringComparison.OrdinalIgnoreCase))
                    baseQuery = baseQuery.Where(c => c.EsCliente);
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

            if (!string.IsNullOrEmpty(request.EstadoIA_WA) && request.EstadoIA_WA != "Todos")
            {
                if (request.EstadoIA_WA == "Operativo")
                    baseQuery = baseQuery.Where(c => c.BotActivoWA && c.EstadoIA_WA == null);
                else if (request.EstadoIA_WA == "Desactivado")
                    baseQuery = baseQuery.Where(c => !c.BotActivoWA && (c.EstadoIA_WA == null || c.EstadoIA_WA == ""));
                else if (request.EstadoIA_WA == "Escalado")
                    baseQuery = baseQuery.Where(c => c.EstadoIA_WA == "Escalado");
                else if (request.EstadoIA_WA == "Límite de uso")
                    baseQuery = baseQuery.Where(c => c.EstadoIA_WA == "LimiteAlcanzado");
                else if (request.EstadoIA_WA == "Desactivado (Captación)")
                    baseQuery = baseQuery.Where(c => c.EstadoIA_WA == "Derivado a Captacion");
            }

            if (!string.IsNullOrEmpty(request.EstadoIA_FB) && request.EstadoIA_FB != "Todos")
            {
                if (request.EstadoIA_FB == "Operativo")
                    baseQuery = baseQuery.Where(c => c.BotActivoFB && c.EstadoIA_FB == null);
                else if (request.EstadoIA_FB == "Desactivado")
                    baseQuery = baseQuery.Where(c => !c.BotActivoFB && (c.EstadoIA_FB == null || c.EstadoIA_FB == ""));
                else if (request.EstadoIA_FB == "Escalado")
                    baseQuery = baseQuery.Where(c => c.EstadoIA_FB == "Escalado");
                else if (request.EstadoIA_FB == "Límite de uso")
                    baseQuery = baseQuery.Where(c => c.EstadoIA_FB == "LimiteAlcanzado");
                else if (request.EstadoIA_FB == "Desactivado (Captación)")
                    baseQuery = baseQuery.Where(c => c.EstadoIA_FB == "Derivado a Captacion");
            }

            var sortBy = request.SortBy?.ToLower() ?? "fechacreacion";
            var isDesc = request.SortDirection != "asc";

            var countsCacheKey = $"Contactos_Counts_{agenteId}_{request.Search}_{request.Estado}_{request.Segmento}_{request.Visibilidad}_{request.Origen}_{request.EstadoPropietario}_{request.EstadoIA_WA}_{request.EstadoIA_FB}_{request.IsArchived}";
            
            var memCache = serviceProvider.GetRequiredService<IMemoryCache>();

            // Anti-stampede: si el cache falla, solo UN hilo computa el count por clave simultáneamente
            (int TotalCount, int NuevosCount, int EnNegociacionCount) counts;
            if (!memCache.TryGetValue(countsCacheKey, out counts))
            {
                var sem = _countLocks.GetOrAdd(countsCacheKey, _ => new SemaphoreSlim(1, 1));
                await sem.WaitAsync(cancellationToken);
                try
                {
                    // Double-check: otro hilo pudo haber llenado el cache mientras esperábamos
                    if (!memCache.TryGetValue(countsCacheKey, out counts))
                    {
                        var swCount = Stopwatch.StartNew();
                        // .OrderBy suprime el EF Core warning [10103] sobre First sin OrderBy
                        var countData = await baseQuery
                            .GroupBy(c => 1)
                            .Select(g => new {
                                TotalCount = g.Count(),
                                NuevosCount = g.Count(c => c.EstadoEmbudo == "Nuevo"),
                                EnNegociacionCount = g.Count(c => c.EstadoEmbudo == "En Negociacion")
                            })
                            .OrderBy(g => g.TotalCount) // Suprime warning [10103]
                            .FirstOrDefaultAsync(cancellationToken);
                        swCount.Stop();
                        counts = (
                            countData?.TotalCount ?? 0,
                            countData?.NuevosCount ?? 0,
                            countData?.EnNegociacionCount ?? 0
                        );
                        memCache.Set(countsCacheKey, counts, TimeSpan.FromMinutes(5));
                    }
                }
                finally
                {
                    sem.Release();
                }
            }

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
                    l.EstadoEmbudo,
                    l.EstadoPropietario,
                    l.EsCliente,
                    l.EsPropietario,
                    l.FechaCreacion,
                    l.AgenteId != agenteId,
                    l.AgenteId != agenteId ? $"{l.Agente!.Nombre} {l.Agente.Apellido}" : null,
                    l.NumeroInteracciones,
                    l.NumeroIntereses,
                    l.NumeroPropiedadesCaptadas,
                    l.NumeroReservas,
                    l.NumeroCierres,
                    l.BotActivoWA,
                    l.BotActivoFB,
                    l.EstadoIA_WA,
                    l.EstadoIA_FB,
                    request.IsArchived
                ))
                .ToListAsync(cancellationToken);

            sw.Stop();

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
