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

            // 1. Cálculos de Totales (Mantenemos la lógica anterior)
            var visitasTotal = await context.Tasks
                .CountAsync(t => t.AgenteId == agenteId && (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completado" && t.FechaInicio >= inicio && t.FechaInicio <= fin);

            var cierresTotal = await context.Leads
                .CountAsync(l => l.AgenteId == agenteId && (l.EtapaEmbudo == "Cerrado" || l.EtapaEmbudo == "Ganado") && ((l.FechaCierre != null && l.FechaCierre >= inicio && l.FechaCierre <= fin) || (l.FechaCierre == null && l.FechaCreacion >= inicio && l.FechaCreacion <= fin)));

            var ofertasTotal = await context.Leads
                .CountAsync(l => l.AgenteId == agenteId && l.EtapaEmbudo == "En Negociación" && l.FechaCreacion >= inicio && l.FechaCreacion <= fin);

            var captacionesTotal = await context.Properties
                .CountAsync(p => p.AgenteId == agenteId && p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin);

            // 2. Generar Puntos de Tendencia (Agrupados por Día)
            // Traemos los datos crudos del rango para agruparlos en memoria (más eficiente para rangos pequeños de analítica)
            var rawVisitas = await context.Tasks
                .AsNoTracking()
                .Where(t => t.AgenteId == agenteId && (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completado" && t.FechaInicio >= inicio && t.FechaInicio <= fin)
                .Select(t => t.FechaInicio.Date)
                .ToListAsync();

            var rawCierres = await context.Leads
                .AsNoTracking()
                .Where(l => l.AgenteId == agenteId && (l.EtapaEmbudo == "Cerrado" || l.EtapaEmbudo == "Ganado") && ((l.FechaCierre != null && l.FechaCierre >= inicio && l.FechaCierre <= fin) || (l.FechaCierre == null && l.FechaCreacion >= inicio && l.FechaCreacion <= fin)))
                .Select(l => (l.FechaCierre ?? l.FechaCreacion).Date)
                .ToListAsync();

            var rawCaptaciones = await context.Properties
                .AsNoTracking()
                .Where(p => p.AgenteId == agenteId && p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin)
                .Select(p => p.FechaIngreso.Date)
                .ToListAsync();

            // Construir la lista de días entre inicio y fin
            var trend = new List<TrendPoint>();
            for (var dt = inicio.Date; dt <= fin.Date; dt = dt.AddDays(1))
            {
                var vCount = rawVisitas.Count(d => d == dt);
                var cCount = rawCierres.Count(d => d == dt);
                var capCount = rawCaptaciones.Count(d => d == dt);
                
                trend.Add(new TrendPoint(dt.ToString("dd MMM"), vCount, cCount, capCount));
            }

            logger.LogInformation("--- Reporte de Tendencia ({Inicio} a {Fin}) ---", inicio.ToString("d"), fin.ToString("d"));
            logger.LogInformation("Visitas: {V} | Cierres: {C} | Captaciones: {Cap}", visitasTotal, cierresTotal, captacionesTotal);

            return Results.Ok(new ActividadResponse(visitasTotal, cierresTotal, ofertasTotal, captacionesTotal, trend));
        })
        .WithTags("Analitica")
        .WithName("ObtenerActividad");
    }
}
