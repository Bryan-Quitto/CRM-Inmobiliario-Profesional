using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;
using System.Diagnostics;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ListarPropiedadesFeature
{
    public record GetPropiedadesRequest(
        int? PageNumber,
        int? PageSize,
        Guid? CheckContactoId,
        string? SearchQuery,
        string? EstadoComercial,
        string? TipoPropiedad,
        string? Operacion,
        decimal? PrecioMin,
        decimal? PrecioMax,
        decimal? AreaTotalMin,
        decimal? AreaTotalMax,
        int? HabitacionesMin,
        int? HabitacionesMax,
        int? AniosAntiguedadMin,
        int? AniosAntiguedadMax,
        bool? EsCaptacionPropia,
        string? SortBy,
        string? SortDirection,
        bool IsArchived = false
    );

    public record Response(
        Guid Id,
        string Titulo,
        string TipoPropiedad,
        string Operacion,
        decimal Precio,
        string Sector,
        string Ciudad,
        string EstadoComercial,
        bool EsCaptacionPropia,
        decimal PorcentajeComision,
        string AgenteNombre,
        Guid GestorId,
        string GestorNombre,
        Guid? PropietarioId,
        Guid? CerradoConId,
        string? CerradoConNombre,
        string? ImagenPortadaUrl,
        DateTimeOffset FechaIngreso,
        PropertyPermissions Permissions,
        ActiveTransactionInfo? ActiveTransaction,
        string Version,
        int Habitaciones,
        decimal AreaTotal,
        int? AniosAntiguedad,
        bool AlreadyHasContact = false,
        bool IsArchivedForCurrentUser = false);

    public record PropertyPermissions(
        bool CanEditMasterData,
        bool CanChangeStatus);

    public record ActiveTransactionInfo(
        Guid AgenteId,
        string AgenteNombre);

    // Semáforos por clave para evitar Cache Stampede
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _countLocks = new();

    public static RouteHandlerBuilder MapListarPropiedadesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades", async ([AsParameters] GetPropiedadesRequest request, ClaimsPrincipal user, CrmDbContext context, IServiceProvider serviceProvider, CancellationToken cancellationToken) =>
        {
            var actualPageNumber = request.PageNumber ?? 1;
            var actualPageSize = request.PageSize ?? 50;

            var currentUserId = user.GetRequiredUserId();

            string? contactPhoneToShare = null;
            string? cleanPhoneToShare = null;
            if (request.CheckContactoId.HasValue)
            {
                contactPhoneToShare = await context.Contactos
                    .AsNoTracking()
                    .Where(c => c.Id == request.CheckContactoId.Value)
                    .Select(c => c.Telefono)
                    .FirstOrDefaultAsync();

                if (contactPhoneToShare != null)
                {
                    cleanPhoneToShare = new string(contactPhoneToShare.Where(char.IsDigit).ToArray());
                }
            }

            // Obtenemos la agencia del agente actual primero
            var agenciaId = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == currentUserId)
                .Select(a => a.AgenciaId)
                .FirstOrDefaultAsync();

            var query = context.Properties.AsNoTracking();

            if (agenciaId.HasValue)
            {
                // En agencia ves todo lo de la agencia, o si eres el dueño, o si fuiste el creador y el agente invitado no ha activado su cuenta
                query = query.Where(p => p.AgenciaId == agenciaId || 
                                       p.AgenteId == currentUserId || 
                                       (p.Transactions.Any(t => t.CreatedById == currentUserId) && (p.Agente == null || !p.Agente.Activo)));
            }
            else
            {
                // Independiente: Ves lo que captaste, o si fuiste el creador y el agente invitado no ha activado su cuenta
                query = query.Where(p => p.AgenteId == currentUserId || 
                                       (p.Transactions.Any(t => t.CreatedById == currentUserId) && (p.Agente == null || !p.Agente.Activo)));
            }

            var archivedQuery = context.AgentArchivedProperties.Where(a => a.AgentId == currentUserId);

            if (request.IsArchived)
            {
                query = query.Where(p => archivedQuery.Any(a => a.PropiedadId == p.Id));
            }
            else
            {
                query = query.Where(p => !archivedQuery.Any(a => a.PropiedadId == p.Id));
            }

            // Aplicar filtros dinámicos
            if (!string.IsNullOrWhiteSpace(request.SearchQuery))
            {
                var searchPattern = $"%{CrmDbContext.NormalizeText(request.SearchQuery)}%";
                query = query.Where(p => EF.Functions.ILike(p.NormalizedSearchText, searchPattern));
            }

            if (!string.IsNullOrWhiteSpace(request.EstadoComercial) && request.EstadoComercial != "Todos")
                query = query.Where(p => p.EstadoComercial == request.EstadoComercial);

            if (!string.IsNullOrWhiteSpace(request.TipoPropiedad) && request.TipoPropiedad != "Todos")
                query = query.Where(p => p.TipoPropiedad == request.TipoPropiedad);

            if (!string.IsNullOrWhiteSpace(request.Operacion) && request.Operacion != "Todas")
                query = query.Where(p => p.Operacion == request.Operacion);

            if (request.PrecioMin.HasValue)
                query = query.Where(p => p.Precio >= request.PrecioMin.Value);
            if (request.PrecioMax.HasValue)
                query = query.Where(p => p.Precio <= request.PrecioMax.Value);

            if (request.AreaTotalMin.HasValue)
                query = query.Where(p => p.AreaTotal >= request.AreaTotalMin.Value);
            if (request.AreaTotalMax.HasValue)
                query = query.Where(p => p.AreaTotal <= request.AreaTotalMax.Value);

            if (request.HabitacionesMin.HasValue)
                query = query.Where(p => p.Habitaciones >= request.HabitacionesMin.Value);
            if (request.HabitacionesMax.HasValue)
                query = query.Where(p => p.Habitaciones <= request.HabitacionesMax.Value);

            if (request.AniosAntiguedadMin.HasValue)
                query = query.Where(p => p.AniosAntiguedad >= request.AniosAntiguedadMin.Value);
            if (request.AniosAntiguedadMax.HasValue)
                query = query.Where(p => p.AniosAntiguedad <= request.AniosAntiguedadMax.Value);

            if (request.EsCaptacionPropia.HasValue)
                query = query.Where(p => p.EsCaptacionPropia == request.EsCaptacionPropia.Value);

            var memCache = serviceProvider.GetRequiredService<IMemoryCache>();
            var countsCacheKey = $"Propiedades_Counts_{currentUserId}_{agenciaId}_{request.SearchQuery}_{request.EstadoComercial}_{request.TipoPropiedad}_{request.Operacion}_{request.PrecioMin}_{request.PrecioMax}_{request.AreaTotalMin}_{request.AreaTotalMax}_{request.HabitacionesMin}_{request.HabitacionesMax}_{request.AniosAntiguedadMin}_{request.AniosAntiguedadMax}_{request.EsCaptacionPropia}_{request.IsArchived}";

            (int TotalCount, int CountVentas, int CountAlquiler) counts;
            if (!memCache.TryGetValue(countsCacheKey, out counts))
            {
                var sem = _countLocks.GetOrAdd(countsCacheKey, _ => new SemaphoreSlim(1, 1));
                await sem.WaitAsync(cancellationToken);
                try
                {
                    if (!memCache.TryGetValue(countsCacheKey, out counts))
                    {
                        var swCount = Stopwatch.StartNew();
                        var stats = await query
                            .GroupBy(p => 1)
                            .Select(g => new
                            {
                                TotalCount = g.Count(),
                                CountVentas = g.Count(p => p.Operacion == "Venta"),
                                CountAlquiler = g.Count(p => p.Operacion == "Alquiler")
                            })
                            .OrderBy(g => g.TotalCount)
                            .FirstOrDefaultAsync(cancellationToken);
                        
                        swCount.Stop();
                        Console.WriteLine($"[API] Calculó Counts Propiedades en {swCount.ElapsedMilliseconds}ms (Caché Miss)");
                        
                        counts = (
                            stats?.TotalCount ?? 0,
                            stats?.CountVentas ?? 0,
                            stats?.CountAlquiler ?? 0
                        );
                        memCache.Set(countsCacheKey, counts, TimeSpan.FromMinutes(5));
                    }
                }
                finally
                {
                    sem.Release();
                }
            }

            var totalCount = counts.TotalCount;
            var countVentas = counts.CountVentas;
            var countAlquiler = counts.CountAlquiler;

            // Ordenamiento dinámico
            var sortBy = request.SortBy?.ToLowerInvariant() ?? "fechaingreso";
            var isAsc = (request.SortDirection?.ToLowerInvariant() ?? "desc") == "asc";

            query = sortBy switch
            {
                "precio" => isAsc ? query.OrderBy(p => p.Precio).ThenBy(p => p.Id) : query.OrderByDescending(p => p.Precio).ThenByDescending(p => p.Id),
                "areatotal" => isAsc ? query.OrderBy(p => p.AreaTotal).ThenBy(p => p.Id) : query.OrderByDescending(p => p.AreaTotal).ThenByDescending(p => p.Id),
                "habitaciones" => isAsc ? query.OrderBy(p => p.Habitaciones).ThenBy(p => p.Id) : query.OrderByDescending(p => p.Habitaciones).ThenByDescending(p => p.Id),
                "aniosantiguedad" => isAsc ? query.OrderBy(p => p.AniosAntiguedad).ThenBy(p => p.Id) : query.OrderByDescending(p => p.AniosAntiguedad).ThenByDescending(p => p.Id),
                _ => isAsc ? query.OrderBy(p => p.FechaIngreso).ThenBy(p => p.Id) : query.OrderByDescending(p => p.FechaIngreso).ThenByDescending(p => p.Id)
            };

            var propiedades = await query
                .Skip((actualPageNumber - 1) * actualPageSize)
                .Take(actualPageSize)
                .Select(p => new
                {
                    Property = p,
                    ActiveTransaction = p.Transactions
                        .Where(t => t.TransactionStatus == "Active")
                        .OrderByDescending(t => t.TransactionDate)
                        .Select(t => new ActiveTransactionInfo(
                            t.CreatedById,
                            t.CreatedBy != null ? t.CreatedBy.Nombre + " " + t.CreatedBy.Apellido : "Agente desconocido"))
                        .FirstOrDefault()
                })
                .Select(x => new Response(
                    x.Property.Id,
                    x.Property.Titulo,
                    x.Property.TipoPropiedad,
                    x.Property.Operacion,
                    x.Property.Precio,
                    x.Property.Sector,
                    x.Property.Ciudad,
                    x.Property.EstadoComercial,
                    x.Property.EsCaptacionPropia,
                    x.Property.AgenteId == currentUserId ? x.Property.PorcentajeComision : 0m,
                    x.Property.Agente != null ? x.Property.Agente.Nombre + " " + x.Property.Agente.Apellido : string.Empty,
                    (x.Property.EsCaptadorActivo && x.Property.AgenteId != null) ? x.Property.AgenteId.Value : x.Property.CreatedByAgenteId ?? Guid.Empty,
                    (x.Property.EsCaptadorActivo && x.Property.Agente != null) ? x.Property.Agente.Nombre + " " + x.Property.Agente.Apellido : (x.Property.CreatedByAgente != null ? x.Property.CreatedByAgente.Nombre + " " + x.Property.CreatedByAgente.Apellido : "Agente desconocido"),
                    x.Property.AgenteId == currentUserId ? x.Property.PropietarioId : null,
                    x.Property.AgenteId == currentUserId || (x.Property.CerradoCon != null && x.Property.CerradoCon.AgenteId == currentUserId) ? x.Property.CerradoConId : null,
                    x.Property.AgenteId == currentUserId || (x.Property.CerradoCon != null && x.Property.CerradoCon.AgenteId == currentUserId) 
                        ? (x.Property.CerradoCon != null ? x.Property.CerradoCon.Nombre + " " + x.Property.CerradoCon.Apellido : null) 
                        : "Oculto (Privacidad del Inversionista)",
                    x.Property.Media
                        .Where(m => m.EsPrincipal)
                        .OrderBy(m => m.Id)
                        .Select(m => m.UrlPublica)
                        .FirstOrDefault(),
                    x.Property.FechaIngreso,
                    new PropertyPermissions(
                        x.Property.AgenteId == currentUserId || (x.Property.Transactions.Any(t => t.CreatedById == currentUserId) && (x.Property.Agente == null || !x.Property.Agente.Activo)),
                        x.Property.AgenteId == currentUserId || (x.Property.Transactions.Any(t => t.CreatedById == currentUserId) && (x.Property.Agente == null || !x.Property.Agente.Activo))
                    ),
                    x.ActiveTransaction,
                    x.Property.Version.ToString(),
                    x.Property.Habitaciones,
                    x.Property.AreaTotal,
                    x.Property.AniosAntiguedad,
                    false,
                    request.IsArchived)) // Lo calcularemos a continuación
                .ToListAsync(cancellationToken);

            if (cleanPhoneToShare != null)
            {
                var gestorIds = propiedades.Select(p => p.GestorId).Distinct().ToList();
                var contactosGestores = await context.Contactos
                    .AsNoTracking()
                    .Where(c => gestorIds.Contains(c.AgenteId))
                    .Select(c => new { c.AgenteId, c.Telefono })
                    .ToListAsync();
                    
                foreach(var c in contactosGestores)
                {
                    var cleanContactPhone = string.IsNullOrEmpty(c.Telefono) ? null : new string(c.Telefono.Where(char.IsDigit).ToArray());
                    if (cleanContactPhone != null && cleanContactPhone == cleanPhoneToShare || c.Telefono == contactPhoneToShare)
                    {
                        for (int i = 0; i < propiedades.Count; i++)
                        {
                            if (propiedades[i].GestorId == c.AgenteId)
                            {
                                propiedades[i] = propiedades[i] with { AlreadyHasContact = true };
                            }
                        }
                    }
                }
            }

            return Results.Ok(new 
            {
                Items = propiedades,
                TotalCount = totalCount,
                CountVentas = countVentas,
                CountAlquiler = countAlquiler,
                PageNumber = actualPageNumber,
                PageSize = actualPageSize
            });
        })
        .WithTags("Propiedades")
        .WithName("ListarPropiedades");
    }
}

