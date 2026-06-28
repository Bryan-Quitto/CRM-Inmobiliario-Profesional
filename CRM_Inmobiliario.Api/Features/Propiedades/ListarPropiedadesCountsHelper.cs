using System.Collections.Concurrent;
using System.Diagnostics;
using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ListarPropiedadesCountsHelper
{
    private static readonly ConcurrentDictionary<string, SemaphoreSlim> _countLocks = new();

    public static async Task<(int TotalCount, int CountVentas, int CountAlquiler)> GetCountsAsync(
        IMemoryCache memCache,
        IQueryable<Property> query,
        Guid currentUserId,
        Guid? agenciaId,
        GetPropiedadesRequest request,
        CancellationToken cancellationToken)
    {
        var countsCacheKey = $"Propiedades_Counts_{currentUserId}_{agenciaId}_{request.SearchQuery}_{request.EstadoComercial}_{request.TipoPropiedad}_{request.Operacion}_{request.PrecioMin}_{request.PrecioMax}_{request.AreaTotalMin}_{request.AreaTotalMax}_{request.HabitacionesMin}_{request.HabitacionesMax}_{request.AniosAntiguedadMin}_{request.AniosAntiguedadMax}_{request.EsCaptacionPropia}_{request.IsArchived}";

        if (!memCache.TryGetValue(countsCacheKey, out (int TotalCount, int CountVentas, int CountAlquiler) counts))
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
        
        return counts;
    }
}
