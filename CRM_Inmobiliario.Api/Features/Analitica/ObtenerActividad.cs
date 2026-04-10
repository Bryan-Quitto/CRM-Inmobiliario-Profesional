using System.Security.Claims;
using System.Diagnostics;
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
            var swTotal = Stopwatch.StartNew();
            var agenteId = user.GetRequiredUserId();

            // OPTIMIZACIÓN SUPREMA: "THE ONE TRIP PATTERN" (Analítica)
            // Consolidamos todos los conteos y tendencias en un solo Round-trip.
            var swQuery = Stopwatch.StartNew();
            var megaData = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new
                {
                    // Conteos
                    Visitas = a.Tasks.Count(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicio && t.FechaInicio <= fin),
                    Cierres = a.Leads.Count(l => (l.EtapaEmbudo == "Cerrado" || l.EtapaEmbudo == "Ganado") && ((l.FechaCierre != null && l.FechaCierre >= inicio && l.FechaCierre <= fin) || (l.FechaCierre == null && l.FechaCreacion >= inicio && l.FechaCreacion <= fin))),
                    Ofertas = a.Leads.Count(l => l.EtapaEmbudo == "En Negociación" && l.FechaCreacion >= inicio && l.FechaCreacion <= fin),
                    Captaciones = a.Properties.Count(p => p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin),

                    // Datos para Tendencias (traemos los crudos para agrupar en memoria y evitar múltiples queries SQL)
                    RawVisitas = a.Tasks
                        .Where(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicio && t.FechaInicio <= fin)
                        .Select(t => t.FechaInicio)
                        .ToList(),
                    RawCierres = a.Leads
                        .Where(l => (l.EtapaEmbudo == "Cerrado" || l.EtapaEmbudo == "Ganado") && ((l.FechaCierre != null && l.FechaCierre >= inicio && l.FechaCierre <= fin) || (l.FechaCierre == null && l.FechaCreacion >= inicio && l.FechaCreacion <= fin)))
                        .Select(l => l.FechaCierre ?? l.FechaCreacion)
                        .ToList(),
                    RawCaptaciones = a.Properties
                        .Where(p => p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin)
                        .Select(p => p.FechaIngreso)
                        .ToList()
                })
                .FirstOrDefaultAsync();
            swQuery.Stop();

            if (megaData == null) return Results.NotFound("Agente no encontrado");

            // PROCESAMIENTO EN MEMORIA (Inmediato)
            var trend = new List<TrendPoint>();
            var vDict = megaData.RawVisitas.GroupBy(x => x.Date).ToDictionary(g => g.Key, g => g.Count());
            var cDict = megaData.RawCierres.GroupBy(x => x.Date).ToDictionary(g => g.Key, g => g.Count());
            var capDict = megaData.RawCaptaciones.GroupBy(x => x.Date).ToDictionary(g => g.Key, g => g.Count());

            for (var dt = inicio.Date; dt <= fin.Date; dt = dt.AddDays(1))
            {
                trend.Add(new TrendPoint(
                    dt.ToString("dd MMM"), 
                    vDict.GetValueOrDefault(dt, 0), 
                    cDict.GetValueOrDefault(dt, 0), 
                    capDict.GetValueOrDefault(dt, 0)));
            }

            swTotal.Stop();
            Console.WriteLine("\n⚡ [PERFORMANCE: ANALYTICS ONE TRIP]");
            Console.WriteLine($"   |-- 📡 Latencia Única DB: {swQuery.ElapsedMilliseconds}ms");
            Console.WriteLine($"   |-- ✅ TIEMPO TOTAL:     {swTotal.ElapsedMilliseconds}ms");
            Console.WriteLine("---------------------------------------\n");

            return Results.Ok(new ActividadResponse(
                megaData.Visitas, 
                megaData.Cierres, 
                megaData.Ofertas, 
                megaData.Captaciones, 
                trend));
        })
        .WithTags("Analitica")
        .WithName("ObtenerActividad")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization").SetVaryByQuery("inicio", "fin"));
    }
}
