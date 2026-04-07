using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record TrendPoint(string Fecha, int Visitas, int Cierres, int Captaciones);

public record ActividadResponse(
    int VisitasCompletadas,
    int CierresRealizados,
    int OfertasGeneradas,
    int CaptacionesPropias,
    List<TrendPoint> Trend
);

public static class ObtenerActividadEndpoint
{
    public static IEndpointConventionBuilder MapObtenerActividadEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/actividad", async (
            DateTimeOffset inicio, 
            DateTimeOffset fin, 
            ClaimsPrincipal user, 
            CrmDbContext context,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("Analitica.Actividad");
            var agenteId = user.GetRequiredUserId();

            // 1. Ejecución secuencial (EF Core no permite paralelismo en el mismo DbContext)
            var visitasCount = await context.Tasks
                .AsNoTracking()
                .CountAsync(t => t.AgenteId == agenteId && (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completado" && t.FechaInicio >= inicio && t.FechaInicio <= fin);

            var cierresCount = await context.Leads
                .AsNoTracking()
                .CountAsync(l => l.AgenteId == agenteId && (l.EtapaEmbudo == "Cerrado" || l.EtapaEmbudo == "Ganado") && ((l.FechaCierre != null && l.FechaCierre >= inicio && l.FechaCierre <= fin) || (l.FechaCierre == null && l.FechaCreacion >= inicio && l.FechaCreacion <= fin)));

            var ofertasCount = await context.Leads
                .AsNoTracking()
                .CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo == "En Negociación" && l.FechaCreacion >= inicio && l.FechaCreacion <= fin);

            var captacionesCount = await context.Properties
                .AsNoTracking()
                .CountAsync(p => p.AgenteId == agenteId && p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin);

            // Tendencias
            var trendVisitas = await context.Tasks
                .AsNoTracking()
                .Where(t => t.AgenteId == agenteId && (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completado" && t.FechaInicio >= inicio && t.FechaInicio <= fin)
                .GroupBy(t => t.FechaInicio.Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            var trendCierres = await context.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && (l.EtapaEmbudo == "Cerrado" || l.EtapaEmbudo == "Ganado") && ((l.FechaCierre != null && l.FechaCierre >= inicio && l.FechaCierre <= fin) || (l.FechaCierre == null && l.FechaCreacion >= inicio && l.FechaCreacion <= fin)))
                .GroupBy(l => (l.FechaCierre ?? l.FechaCreacion).Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            var trendCaptaciones = await context.Properties
                .AsNoTracking()
                .Where(p => p.AgenteId == agenteId && p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin)
                .GroupBy(p => p.FechaIngreso.Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            // 2. Mapeo final
            var trend = new List<TrendPoint>();
            var vDict = trendVisitas.ToDictionary(x => x.Fecha, x => x.Cantidad);
            var cDict = trendCierres.ToDictionary(x => x.Fecha, x => x.Cantidad);
            var capDict = trendCaptaciones.ToDictionary(x => x.Fecha, x => x.Cantidad);

            for (var dt = inicio.Date; dt <= fin.Date; dt = dt.AddDays(1))
            {
                trend.Add(new TrendPoint(
                    dt.ToString("dd MMM"), 
                    vDict.GetValueOrDefault(dt, 0), 
                    cDict.GetValueOrDefault(dt, 0), 
                    capDict.GetValueOrDefault(dt, 0)));
            }

            logger.LogInformation("--- Reporte Actividad ({Inicio} a {Fin}) ---", inicio.ToString("d"), fin.ToString("d"));

            return Results.Ok(new ActividadResponse(
                visitasCount, 
                cierresCount, 
                ofertasCount, 
                captacionesCount, 
                trend));
        })
        .WithTags("Analitica")
        .WithName("ObtenerActividad")
        .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)).SetVaryByHeader("Authorization"));
    }
}
