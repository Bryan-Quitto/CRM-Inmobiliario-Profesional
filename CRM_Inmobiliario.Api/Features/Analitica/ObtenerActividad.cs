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
            IDbContextFactory<CrmDbContext> factory,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("Analitica.Actividad");
            var agenteId = user.GetRequiredUserId();

            // 1. Creamos contextos independientes para paralelismo masivo
            using var ctxV = await factory.CreateDbContextAsync();
            using var ctxC = await factory.CreateDbContextAsync();
            using var ctxO = await factory.CreateDbContextAsync();
            using var ctxCap = await factory.CreateDbContextAsync();
            using var ctxRV = await factory.CreateDbContextAsync();
            using var ctxRC = await factory.CreateDbContextAsync();
            using var ctxRCap = await factory.CreateDbContextAsync();

            // 2. Definición de Tareas de Conteo
            var visitasTask = ctxV.Tasks
                .AsNoTracking()
                .CountAsync(t => t.AgenteId == agenteId && (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completado" && t.FechaInicio >= inicio && t.FechaInicio <= fin);

            var cierresTask = ctxC.Leads
                .AsNoTracking()
                .CountAsync(l => l.AgenteId == agenteId && (l.EtapaEmbudo == "Cerrado" || l.EtapaEmbudo == "Ganado") && ((l.FechaCierre != null && l.FechaCierre >= inicio && l.FechaCierre <= fin) || (l.FechaCierre == null && l.FechaCreacion >= inicio && l.FechaCreacion <= fin)));

            var ofertasTask = ctxO.Leads
                .AsNoTracking()
                .CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo == "En Negociación" && l.FechaCreacion >= inicio && l.FechaCreacion <= fin);

            var captacionesTask = ctxCap.Properties
                .AsNoTracking()
                .CountAsync(p => p.AgenteId == agenteId && p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin);

            // 3. Definición de Tareas de Tendencia (Agrupadas en SQL para máxima velocidad)
            var trendVisitasTask = ctxRV.Tasks
                .AsNoTracking()
                .Where(t => t.AgenteId == agenteId && (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completado" && t.FechaInicio >= inicio && t.FechaInicio <= fin)
                .GroupBy(t => t.FechaInicio.Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            var trendCierresTask = ctxRC.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && (l.EtapaEmbudo == "Cerrado" || l.EtapaEmbudo == "Ganado") && ((l.FechaCierre != null && l.FechaCierre >= inicio && l.FechaCierre <= fin) || (l.FechaCierre == null && l.FechaCreacion >= inicio && l.FechaCreacion <= fin)))
                .GroupBy(l => (l.FechaCierre ?? l.FechaCreacion).Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            var trendCaptacionesTask = ctxRCap.Properties
                .AsNoTracking()
                .Where(p => p.AgenteId == agenteId && p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin)
                .GroupBy(p => p.FechaIngreso.Date)
                .Select(g => new { Fecha = g.Key, Cantidad = g.Count() })
                .ToListAsync();

            // 4. Ejecución simultánea de las 7 consultas
            await Task.WhenAll(visitasTask, cierresTask, ofertasTask, captacionesTask, trendVisitasTask, trendCierresTask, trendCaptacionesTask);

            // 5. Mapeo final (Unión de huecos vacíos en memoria)
            var trend = new List<TrendPoint>();
            var vDict = trendVisitasTask.Result.ToDictionary(x => x.Fecha, x => x.Cantidad);
            var cDict = trendCierresTask.Result.ToDictionary(x => x.Fecha, x => x.Cantidad);
            var capDict = trendCaptacionesTask.Result.ToDictionary(x => x.Fecha, x => x.Cantidad);

            for (var dt = inicio.Date; dt <= fin.Date; dt = dt.AddDays(1))
            {
                trend.Add(new TrendPoint(
                    dt.ToString("dd MMM"), 
                    vDict.GetValueOrDefault(dt, 0), 
                    cDict.GetValueOrDefault(dt, 0), 
                    capDict.GetValueOrDefault(dt, 0)));
            }

            logger.LogInformation("--- Reporte Paralelizado ({Inicio} a {Fin}) ---", inicio.ToString("d"), fin.ToString("d"));

            return Results.Ok(new ActividadResponse(
                visitasTask.Result, 
                cierresTask.Result, 
                ofertasTask.Result, 
                captacionesTask.Result, 
                trend));
        })
        .WithTags("Analitica")
        .WithName("ObtenerActividad")
        .CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)).SetVaryByHeader("Authorization"));
    }
}
