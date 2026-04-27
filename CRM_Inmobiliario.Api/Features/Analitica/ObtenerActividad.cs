using System.Security.Claims;
using System.Diagnostics;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Dashboard;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Analitica;

public record TrendPoint(string Fecha, int Visitas, int Cierres, int Captaciones);

public record KpiVisita(Guid Id, string Titulo, string Fecha, string? Cliente, string? Propiedad);
public record KpiCierre(Guid Id, string Cliente, string Propiedad, string FechaCierre);
public record KpiOferta(Guid Id, string Cliente, string Propiedad, string Fecha);
public record KpiCaptacion(Guid Id, string Titulo, string Fecha, decimal Precio);

public record ActividadDetalles(
    List<KpiVisita> Visitas,
    List<KpiCierre> Cierres,
    List<KpiOferta> Ofertas,
    List<KpiCaptacion> Captaciones
);

public record ActividadResponse(
    int VisitasCompletadas,
    int CierresRealizados,
    int OfertasGeneradas,
    int CaptacionesPropias,
    List<TrendPoint> Trend,
    ActividadDetalles Detalles
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

            // OPTIMIZACIÓN SUPREMA: "THE ONE TRIP PATTERN" (Analítica con Detalles)
            var swQuery = Stopwatch.StartNew();
            var megaData = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new
                {
                    // Conteos
                    VisitasCount = a.Tasks.Count(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicio && t.FechaInicio <= fin),
                    CierresCount = a.Properties.SelectMany(p => p.Transactions).Count(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && t.TransactionStatus != "Cancelled" && t.TransactionDate >= inicio && t.TransactionDate <= fin),
                    OfertasCount = a.Leads.Count(l => l.EtapaEmbudo == "En Negociación" && l.FechaCreacion >= inicio && l.FechaCreacion <= fin),
                    CaptacionesCount = a.Properties.Count(p => p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin),

                    // Detalles para Modales
                    DetallesVisitas = a.Tasks
                        .Where(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicio && t.FechaInicio <= fin)
                        .OrderByDescending(t => t.FechaInicio)
                        .Select(t => new KpiVisita(t.Id, t.Titulo, t.FechaInicio.ToString("yyyy-MM-dd HH:mm"), t.Cliente != null ? (t.Cliente.Nombre + " " + t.Cliente.Apellido) : null, t.Propiedad != null ? t.Propiedad.Titulo : null))
                        .ToList(),
                    DetallesCierres = a.Properties.SelectMany(p => p.Transactions)
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && t.TransactionStatus != "Cancelled" && t.TransactionDate >= inicio && t.TransactionDate <= fin)
                        .OrderByDescending(t => t.TransactionDate)
                        .Select(t => new KpiCierre(t.Id, t.Lead != null ? t.Lead.Nombre + " " + t.Lead.Apellido : "Sin Cliente", t.Property!.Titulo, t.TransactionDate.ToString("yyyy-MM-dd")))
                        .ToList(),
                    DetallesOfertas = a.Leads
                        .Where(l => l.EtapaEmbudo == "En Negociación" && l.FechaCreacion >= inicio && l.FechaCreacion <= fin)
                        .OrderByDescending(l => l.FechaCreacion)
                        .Select(l => new KpiOferta(l.Id, l.Nombre + " " + l.Apellido, l.PropertyInterests.Where(i => i.Propiedad != null).Select(i => i.Propiedad!.Titulo).FirstOrDefault() ?? "Sin Propiedad", l.FechaCreacion.ToString("yyyy-MM-dd")))
                        .ToList(),
                    DetallesCaptaciones = a.Properties
                        .Where(p => p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin)
                        .OrderByDescending(p => p.FechaIngreso)
                        .Select(p => new KpiCaptacion(p.Id, p.Titulo, p.FechaIngreso.ToString("yyyy-MM-dd"), p.Precio))
                        .ToList(),

                    // Datos para Tendencias
                    RawVisitas = a.Tasks
                        .Where(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicio && t.FechaInicio <= fin)
                        .Select(t => t.FechaInicio)
                        .ToList(),
                    RawCierres = a.Properties.SelectMany(p => p.Transactions)
                        .Where(t => (t.TransactionType == "Sale" || t.TransactionType == "Rent") && t.TransactionStatus != "Cancelled" && t.TransactionDate >= inicio && t.TransactionDate <= fin)
                        .Select(t => t.TransactionDate)
                        .ToList(),
                    RawCaptaciones = a.Properties
                        .Where(p => p.EsCaptacionPropia && p.FechaIngreso >= inicio && p.FechaIngreso <= fin)
                        .Select(p => p.FechaIngreso)
                        .ToList()
                })
                .FirstOrDefaultAsync();
            swQuery.Stop();

            if (megaData == null) return Results.NotFound("Agente no encontrado");

            // PROCESAMIENTO EN MEMORIA
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

            var detalles = new ActividadDetalles(
                megaData.DetallesVisitas,
                megaData.DetallesCierres,
                megaData.DetallesOfertas,
                megaData.DetallesCaptaciones
            );

            return Results.Ok(new ActividadResponse(
                megaData.VisitasCount, 
                megaData.CierresCount, 
                megaData.OfertasCount, 
                megaData.CaptacionesCount, 
                trend,
                detalles));
        })
        .WithTags("Analitica")
        .WithName("ObtenerActividad")
        .CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization").SetVaryByQuery("inicio", "fin"));
    }

    public static RouteHandlerBuilder MapObtenerVentasMensualesEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/analitica/ventas-mensuales", async (ClaimsPrincipal user, CrmDbContext context, IKpiWarmingService warmingService) =>
        {
            var swTotal = Stopwatch.StartNew();
            var agenteId = user.GetRequiredUserId();

            // 1. Intentar obtener desde la Cache Interna de Warming
            if (warmingService.TryGetMonthlySales(agenteId, out var cachedSales))
            {
                swTotal.Stop();
                Console.WriteLine($"\n🚀 [SALES CACHE HIT] Agente: {agenteId} | Latencia: {swTotal.ElapsedMilliseconds}ms\n");
                return Results.Ok(cachedSales);
            }

            // 2. Fallback: Cálculo manual para el mes actual (USANDO OFFSET ECUADOR)
            var ecuadorOffset = TimeSpan.FromHours(-5);
            var nowEcuador = DateTimeOffset.UtcNow.ToOffset(ecuadorOffset);

            var inicioMesEcuador = new DateTimeOffset(nowEcuador.Year, nowEcuador.Month, 1, 0, 0, 0, ecuadorOffset);
            var finMesEcuador = inicioMesEcuador.AddMonths(1).AddTicks(-1);
            
            var inicioMesUtc = inicioMesEcuador.ToUniversalTime();
            var finMesUtc = finMesEcuador.ToUniversalTime();
            
            var etapasVenta = new[] { "Cerrado", "Ganado" };

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

            // 3. PROCESAR ANALÍTICA MENSUAL (Lógica dinámica de semanas)
            var semanas = new List<(DateTime Inicio, DateTime Fin)>();
            var primerDia = new DateTime(nowEcuador.Year, nowEcuador.Month, 1);
            var ultimoDiaMes = primerDia.AddMonths(1).AddDays(-1);

            var curr = primerDia;
            while (curr <= ultimoDiaMes)
            {
                var inicioSemana = curr;
                int diasHastaDomingo = (int)DayOfWeek.Sunday - (int)inicioSemana.DayOfWeek;
                if (diasHastaDomingo < 0) diasHastaDomingo += 7;

                var finSemana = inicioSemana.AddDays(diasHastaDomingo);
                if (finSemana > ultimoDiaMes) finSemana = ultimoDiaMes;

                semanas.Add((inicioSemana, finSemana));
                curr = finSemana.AddDays(1);
            }

            var semanasFinales = new List<(DateTime Inicio, DateTime Fin)>();
            for (int i = 0; i < semanas.Count; i++)
            {
                var s = semanas[i];
                var duracion = (s.Fin - s.Inicio).Days + 1;

                if (i == 0 && duracion < 4 && semanas.Count > 1)
                {
                    semanas[i + 1] = (s.Inicio, semanas[i + 1].Fin);
                    continue;
                }
                if (i == semanas.Count - 1 && duracion < 4 && semanasFinales.Count > 0)
                {
                    var anterior = semanasFinales[^1];
                    semanasFinales[^1] = (anterior.Inicio, s.Fin);
                    continue;
                }

                semanasFinales.Add(s);
            }

            var trendSemanas = new List<WeeklyTrendPoint>();
            for (int i = 0; i < semanasFinales.Count; i++)
            {
                var s = semanasFinales[i];
                var vCount = megaData.RawVisitas.Count(x => x.ToOffset(ecuadorOffset).Date >= s.Inicio.Date && x.ToOffset(ecuadorOffset).Date <= s.Fin.Date);
                var cCount = megaData.RawCierres.Count(x => x.ToOffset(ecuadorOffset).Date >= s.Inicio.Date && x.ToOffset(ecuadorOffset).Date <= s.Fin.Date);
                var capCount = megaData.RawCaptaciones.Count(x => x.ToOffset(ecuadorOffset).Date >= s.Inicio.Date && x.ToOffset(ecuadorOffset).Date <= s.Fin.Date);

                trendSemanas.Add(new WeeklyTrendPoint($"S{i + 1}", vCount, cCount, capCount));
            }

            var sales = new VentasMensualesResponse(
                megaData.Visitas,
                megaData.Cierres,
                megaData.Ofertas,
                megaData.Captaciones,
                trendSemanas
            );

            // Actualizar la cache para la próxima vez
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
