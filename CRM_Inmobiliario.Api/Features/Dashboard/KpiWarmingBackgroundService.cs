using System.Collections.Concurrent;
using System.Diagnostics;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Dashboard;

public class KpiWarmingBackgroundService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly KpiWarmingService _warmingService;
    private readonly ILogger<KpiWarmingBackgroundService> _logger;
    private readonly ConcurrentDictionary<Guid, DateTime> _lastRequestTime = new();
    private const int DebounceMs = 2000;

    public KpiWarmingBackgroundService(
        IServiceProvider serviceProvider,
        IKpiWarmingService warmingService,
        ILogger<KpiWarmingBackgroundService> logger)
    {
        _serviceProvider = serviceProvider;
        _warmingService = (KpiWarmingService)warmingService;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("🚀 KPI Warming Background Service iniciado.");

        await foreach (var agenteId in _warmingService.Reader.ReadAllAsync(stoppingToken))
        {
            _logger.LogDebug("🔔 Notificación de cambio recibida para Agente: {AgenteId}", agenteId);
            
            // Procesar en una tarea separada para no bloquear la lectura del canal
            _ = Task.Run(async () =>
            {
                try
                {
                    // Debounce: Esperar si hay múltiples cambios rápidos
                    _lastRequestTime[agenteId] = DateTime.UtcNow;
                    await Task.Delay(DebounceMs, stoppingToken);

                    // Solo procesar si esta es la última petición de este agente
                    if (DateTime.UtcNow - _lastRequestTime[agenteId] < TimeSpan.FromMilliseconds(DebounceMs - 100))
                    {
                        return;
                    }

                    await ProcessWarmingAsync(agenteId, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "❌ Error procesando warming para Agente: {AgenteId}", agenteId);
                }
            }, stoppingToken);
        }
    }

    private async Task ProcessWarmingAsync(Guid agenteId, CancellationToken stoppingToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CrmDbContext>();

        var sw = Stopwatch.StartNew();
        
        // ESTÁNDAR DE TIEMPO: ECUADOR (UTC-5)
        var ecuadorOffset = TimeSpan.FromHours(-5);
        var nowEcuador = DateTimeOffset.UtcNow.ToOffset(ecuadorOffset);

        // 1. DASHBOARD KPIS (HOY EN ECUADOR)
        // Definimos el fin del día basado en el calendario de Ecuador y luego lo pasamos a UTC para la DB
        var finDelDiaEcuador = new DateTimeOffset(nowEcuador.Year, nowEcuador.Month, nowEcuador.Day, 23, 59, 59, ecuadorOffset);
        var limiteHoyUtc = finDelDiaEcuador.ToUniversalTime();
        var etapasExcluidasDashboard = new[] { "En Negociación", "Cerrado", "Perdido" };

        // 2. VENTAS MENSUALES (MES ACTUAL EN ECUADOR)
        var inicioMesEcuador = new DateTimeOffset(nowEcuador.Year, nowEcuador.Month, 1, 0, 0, 0, ecuadorOffset);
        var finMesEcuador = inicioMesEcuador.AddMonths(1).AddTicks(-1);
        
        // Rangos en UTC para las consultas a Supabase
        var inicioMesUtc = inicioMesEcuador.ToUniversalTime();
        var finMesUtc = finMesEcuador.ToUniversalTime();
        
        var etapasVenta = new[] { "Cerrado", "Ganado" };

        var megaData = await context.Agents
            .AsNoTracking()
            .Where(a => a.Id == agenteId)
            .Select(a => new
            {
                // Dashboard
                Propiedades = a.Properties.Count(p => p.EstadoComercial == "Disponible"),
                Prospectos = a.Leads.Count(l => l.EtapaEmbudo != "Perdido"),
                Tareas = a.Tasks.Count(t => t.Estado == "Pendiente" && t.FechaInicio <= limiteHoyUtc),
                LeadsSeguimiento = a.Leads
                    .Where(l => !etapasExcluidasDashboard.Contains(l.EtapaEmbudo) && l.PropertyInterests.Any(i => i.NivelInteres == "Medio" || i.NivelInteres == "Alto"))
                    .Select(l => new LeadDashboardItem(l.Id, l.Nombre, l.Apellido ?? "", l.EtapaEmbudo))
                    .ToList(),
                EmbudoRaw = a.Leads
                    .GroupBy(l => l.EtapaEmbudo)
                    .Select(g => new { Etapa = g.Key, Cantidad = g.Count() })
                    .ToList(),

                // Analítica Mensual (One Trip) usando rangos UTC correctos
                MensualVisitas = a.Tasks.Count(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicioMesUtc && t.FechaInicio <= finMesUtc),
                MensualCierres = a.Leads.Count(l => etapasVenta.Contains(l.EtapaEmbudo) && ((l.FechaCierre != null && l.FechaCierre >= inicioMesUtc && l.FechaCierre <= finMesUtc) || (l.FechaCierre == null && l.FechaCreacion >= inicioMesUtc && l.FechaCreacion <= finMesUtc))),
                MensualOfertas = a.Leads.Count(l => l.EtapaEmbudo == "En Negociación" && l.FechaCreacion >= inicioMesUtc && l.FechaCreacion <= finMesUtc),
                MensualCaptaciones = a.Properties.Count(p => p.EsCaptacionPropia && p.FechaIngreso >= inicioMesUtc && p.FechaIngreso <= finMesUtc),

                // Crudos para tendencia semanal (Los convertiremos a la hora de Ecuador para agrupar)
                RawVisitas = a.Tasks
                    .Where(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicioMesUtc && t.FechaInicio <= finMesUtc)
                    .Select(t => t.FechaInicio)
                    .ToList(),
                RawCierres = a.Leads
                    .Where(l => etapasVenta.Contains(l.EtapaEmbudo) && ((l.FechaCierre != null && l.FechaCierre >= inicioMesUtc && l.FechaCierre <= finMesUtc) || (l.FechaCierre == null && l.FechaCreacion >= inicioMesUtc && l.FechaCreacion <= finMesUtc)))
                    .Select(l => l.FechaCierre ?? l.FechaCreacion)
                    .ToList(),
                RawCaptaciones = a.Properties
                    .Where(p => p.EsCaptacionPropia && p.FechaIngreso >= inicioMesUtc && p.FechaIngreso <= finMesUtc)
                    .Select(p => p.FechaIngreso)
                    .ToList()
            })
            .FirstOrDefaultAsync(stoppingToken);

        if (megaData != null)
        {
            // Procesar Dashboard
            var embudoFinal = megaData.EmbudoRaw
                .Select(x => new EtapaEmbudoItem(x.Etapa ?? "Sin Etapa", x.Cantidad))
                .ToList();

            var kpis = new DashboardKpisResponse(
                megaData.Propiedades,
                megaData.Prospectos,
                megaData.Tareas,
                megaData.LeadsSeguimiento.Count,
                megaData.LeadsSeguimiento,
                embudoFinal
            );

            // 3. PROCESAR ANALÍTICA MENSUAL (Lógica de semanas basada en Ecuador)
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
                if (i == 0 && duracion < 4 && semanas.Count > 1) { semanas[i + 1] = (s.Inicio, semanas[i + 1].Fin); continue; }
                if (i == semanas.Count - 1 && duracion < 4 && semanasFinales.Count > 0) { semanasFinales[^1] = (semanasFinales[^1].Inicio, s.Fin); continue; }
                semanasFinales.Add(s);
            }

            var trendSemanas = new List<WeeklyTrendPoint>();
            for (int i = 0; i < semanasFinales.Count; i++)
            {
                var s = semanasFinales[i];
                // IMPORTANTE: Al comparar, pasamos el dato de DB (UTC) al offset de Ecuador para que el día coincida con el calendario local
                var vCount = megaData.RawVisitas.Count(x => x.ToOffset(ecuadorOffset).Date >= s.Inicio.Date && x.ToOffset(ecuadorOffset).Date <= s.Fin.Date);
                var cCount = megaData.RawCierres.Count(x => x.ToOffset(ecuadorOffset).Date >= s.Inicio.Date && x.ToOffset(ecuadorOffset).Date <= s.Fin.Date);
                var capCount = megaData.RawCaptaciones.Count(x => x.ToOffset(ecuadorOffset).Date >= s.Inicio.Date && x.ToOffset(ecuadorOffset).Date <= s.Fin.Date);

                trendSemanas.Add(new WeeklyTrendPoint($"S{i + 1}", vCount, cCount, capCount));
            }

            var sales = new VentasMensualesResponse(
                megaData.MensualVisitas,
                megaData.MensualCierres,
                megaData.MensualOfertas,
                megaData.MensualCaptaciones,
                trendSemanas
            );

            _warmingService.UpdateKpiCache(agenteId, kpis);
            _warmingService.UpdateSalesCache(agenteId, sales);
            
            sw.Stop();
            _logger.LogInformation("🔥 [KPI & SALES WARMED] Agente: {AgenteId} | Latencia: {Elapsed}ms | Timezone: Ecuador (UTC-5)", agenteId, sw.ElapsedMilliseconds);
        }
    }
}
