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
            
            _ = Task.Run(async () =>
            {
                try
                {
                    _lastRequestTime[agenteId] = DateTime.UtcNow;
                    await Task.Delay(DebounceMs, stoppingToken);

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

        // 1. DASHBOARD & ANALYTICS DATE RANGES (Ecuador UTC-5)
        var limiteHoyUtc = WarmingDateHelper.GetHoyLimiteUtc(nowEcuador, ecuadorOffset);
        var (inicioMesUtc, finMesUtc) = WarmingDateHelper.GetMesActualRangosUtc(nowEcuador, ecuadorOffset);

        var etapasExcluidasDashboard = new[] { "En Negociación", "Cerrado", "Perdido" };
        var etapasVenta = new[] { "Cerrado", "Ganado" };

        // ONE TRIP PATTERN
        var megaData = await context.Agents
            .AsNoTracking()
            .Where(a => a.Id == agenteId)
            .Select(a => new
            {
                // Dashboard
                Propiedades = a.Properties.Count(p => p.EstadoComercial == "Disponible"),
                Prospectos = a.Contactos.Count(l => l.EtapaEmbudo != "Perdido"),
                Tareas = a.Tasks.Count(t => t.Estado == "Pendiente" && t.FechaInicio <= limiteHoyUtc),
                ContactosSeguimiento = a.Contactos
                    .Where(l => !etapasExcluidasDashboard.Contains(l.EtapaEmbudo) && l.PropertyInterests.Any(i => i.NivelInteres == "Medio" || i.NivelInteres == "Alto"))
                    .Select(l => new ContactoDashboardItem(l.Id, l.Nombre, l.Apellido ?? "", l.EtapaEmbudo))
                    .ToList(),
                EmbudoRaw = a.Contactos
                    .GroupBy(l => l.EtapaEmbudo)
                    .Select(g => new { Etapa = g.Key, Cantidad = g.Count() })
                    .ToList(),

                // Analítica Mensual (One Trip)
                MensualVisitas = a.Tasks.Count(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicioMesUtc && t.FechaInicio <= finMesUtc),
                MensualCierres = a.Contactos.Count(l => etapasVenta.Contains(l.EtapaEmbudo) && ((l.FechaCierre != null && l.FechaCierre >= inicioMesUtc && l.FechaCierre <= finMesUtc) || (l.FechaCierre == null && l.FechaCreacion >= inicioMesUtc && l.FechaCreacion <= finMesUtc))),
                MensualOfertas = a.Contactos.Count(l => l.EtapaEmbudo == "En Negociación" && l.FechaCreacion >= inicioMesUtc && l.FechaCreacion <= finMesUtc),
                MensualCaptaciones = a.Properties.Count(p => p.EsCaptacionPropia && p.FechaIngreso >= inicioMesUtc && p.FechaIngreso <= finMesUtc),

                // Crudos para tendencia semanal
                RawVisitas = a.Tasks
                    .Where(t => (t.TipoTarea == "Visita" || t.TipoTarea == "Cita") && t.Estado == "Completada" && t.FechaInicio >= inicioMesUtc && t.FechaInicio <= finMesUtc)
                    .Select(t => t.FechaInicio)
                    .ToList(),
                RawCierres = a.Contactos
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
            // DASHBOARD RESPONSE ASSEMBLY
            var kpis = new DashboardKpisResponse(
                megaData.Propiedades,
                megaData.Prospectos,
                megaData.Tareas,
                megaData.ContactosSeguimiento.Count,
                megaData.ContactosSeguimiento,
                megaData.EmbudoRaw.Select(x => new EtapaEmbudoItem(x.Etapa ?? "Sin Etapa", x.Cantidad)).ToList()
            );

            // WEEKLY TREND PROCESSING (Extracted logic)
            var trendSemanas = WeeklyTrendProcessor.CalculateTrends(
                nowEcuador, 
                ecuadorOffset, 
                megaData.RawVisitas, 
                megaData.RawCierres, 
                megaData.RawCaptaciones);

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
