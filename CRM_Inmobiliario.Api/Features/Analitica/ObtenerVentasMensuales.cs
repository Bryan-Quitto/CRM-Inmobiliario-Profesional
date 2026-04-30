using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Analitica.Utils;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public static class ObtenerVentasMensualesEndpoint
{
    public static RouteHandlerBuilder MapObtenerVentasMensualesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/ventas-mensuales", async (
            ClaimsPrincipal user, 
            CrmDbContext context, 
            IKpiWarmingService warmingService) =>
        {
            var swTotal = Stopwatch.StartNew();
            var agenteId = user.GetRequiredUserId();

            // 1. Intentar obtener desde la Cache Interna de Warming (Zero Wait Policy)
            if (warmingService.TryGetMonthlySales(agenteId, out var cachedSales))
            {
                swTotal.Stop();
                Console.WriteLine($"\n🚀 [SALES CACHE HIT] Agente: {agenteId} | Latencia: {swTotal.ElapsedMilliseconds}ms\n");
                return Results.Ok(cachedSales);
            }

            // 2. Fallback: Cálculo manual para el mes actual (USANDO OFFSET ECUADOR UTC-5)
            var nowEcuador = AnalyticsDateHelper.GetNowEcuador();
            var (inicioMesUtc, finMesUtc) = AnalyticsDateHelper.GetCurrentMonthLimitsUtc();
            
            // THE ONE TRIP PATTERN: Consolidación de conteos y raw dates en un solo viaje a DB
            var megaData = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new
                {
                    Visitas = a.Tasks.Count(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicioMesUtc && t.FechaInicio <= finMesUtc),
                    Cierres = a.Properties.SelectMany(p => p.Transactions).Count(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && t.TransactionStatus != "Cancelled" && t.TransactionDate >= inicioMesUtc && t.TransactionDate <= finMesUtc),
                    Ofertas = a.Leads.Count(l => l.EtapaEmbudo == "En Negociación" && l.FechaCreacion >= inicioMesUtc && l.FechaCreacion <= finMesUtc),
                    Captaciones = a.Properties.Count(p => p.EsCaptacionPropia && p.FechaIngreso >= inicioMesUtc && p.FechaIngreso <= finMesUtc),

                    RawVisitas = a.Tasks
                        .Where(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicioMesUtc && t.FechaInicio <= finMesUtc)
                        .Select(t => t.FechaInicio)
                        .ToList(),
                    RawCierres = a.Properties.SelectMany(p => p.Transactions)
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && t.TransactionStatus != "Cancelled" && t.TransactionDate >= inicioMesUtc && t.TransactionDate <= finMesUtc)
                        .Select(t => t.TransactionDate)
                        .ToList(),
                    RawCaptaciones = a.Properties
                        .Where(p => p.EsCaptacionPropia && p.FechaIngreso >= inicioMesUtc && p.FechaIngreso <= finMesUtc)
                        .Select(p => p.FechaIngreso)
                        .ToList()
                })
                .FirstOrDefaultAsync();

            if (megaData == null) return Results.NotFound("Agente no encontrado");

            // 3. Procesar tendencias semanales usando el Helper
            var semanasFinales = AnalyticsDateHelper.CalculateWeeklyRanges(nowEcuador);
            var trendSemanas = new List<WeeklyTrendPoint>();

            for (int i = 0; i < semanasFinales.Count; i++)
            {
                var s = semanasFinales[i];
                var vCount = megaData.RawVisitas.Count(x => x.ToOffset(AnalyticsDateHelper.EcuadorOffset).Date >= s.Inicio.Date && x.ToOffset(AnalyticsDateHelper.EcuadorOffset).Date <= s.Fin.Date);
                var cCount = megaData.RawCierres.Count(x => x.ToOffset(AnalyticsDateHelper.EcuadorOffset).Date >= s.Inicio.Date && x.ToOffset(AnalyticsDateHelper.EcuadorOffset).Date <= s.Fin.Date);
                var capCount = megaData.RawCaptaciones.Count(x => x.ToOffset(AnalyticsDateHelper.EcuadorOffset).Date >= s.Inicio.Date && x.ToOffset(AnalyticsDateHelper.EcuadorOffset).Date <= s.Fin.Date);

                trendSemanas.Add(new WeeklyTrendPoint($"S{i + 1}", vCount, cCount, capCount));
            }

            var sales = new VentasMensualesResponse(
                megaData.Visitas,
                megaData.Cierres,
                megaData.Ofertas,
                megaData.Captaciones,
                trendSemanas
            );

            // Actualizar la cache de warming
            warmingService.UpdateSalesCache(agenteId, sales);

            swTotal.Stop();
            Console.WriteLine($"\n⚡ [SALES FALLBACK] Agente: {agenteId} | Latencia: {swTotal.ElapsedMilliseconds}ms\n");

            return Results.Ok(sales);
        })
        .WithTags("Analitica")
        .WithName("ObtenerVentasMensuales")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
    }
}
