using System.Collections.Concurrent;
using System.Threading.Channels;

namespace CRM_Inmobiliario.Api.Features.Dashboard;

public record WeeklyTrendPoint(string Semana, int Visitas, int Cierres, int Captaciones);

public record VentasMensualesResponse(
    int TotalVisitas,
    int TotalCierres,
    int TotalOfertas,
    int TotalCaptaciones,
    List<WeeklyTrendPoint> TrendSemanal
);

/// <summary>
/// Interfaz para notificar cambios que afectan a los KPIs del Dashboard y Ventas Mensuales.
/// </summary>
public interface IKpiWarmingService
{
    void NotifyChange(Guid agenteId);
    
    // Dashboard KPIs
    bool TryGetKpis(Guid agenteId, out DashboardKpisResponse? kpis);
    void UpdateKpiCache(Guid agenteId, DashboardKpisResponse kpis);

    // Ventas Mensuales
    bool TryGetMonthlySales(Guid agenteId, out VentasMensualesResponse? sales);
    void UpdateSalesCache(Guid agenteId, VentasMensualesResponse sales);
}

public class KpiWarmingService : IKpiWarmingService
{
    private readonly ConcurrentDictionary<Guid, DashboardKpisResponse> _kpiCache = new();
    private readonly ConcurrentDictionary<Guid, VentasMensualesResponse> _salesCache = new();
    private readonly Channel<Guid> _channel = Channel.CreateUnbounded<Guid>();

    public void NotifyChange(Guid agenteId)
    {
        _channel.Writer.TryWrite(agenteId);
    }

    public bool TryGetKpis(Guid agenteId, out DashboardKpisResponse? kpis)
    {
        return _kpiCache.TryGetValue(agenteId, out kpis);
    }

    public void UpdateKpiCache(Guid agenteId, DashboardKpisResponse kpis)
    {
        _kpiCache[agenteId] = kpis;
    }

    public bool TryGetMonthlySales(Guid agenteId, out VentasMensualesResponse? sales)
    {
        return _salesCache.TryGetValue(agenteId, out sales);
    }

    public void UpdateSalesCache(Guid agenteId, VentasMensualesResponse sales)
    {
        _salesCache[agenteId] = sales;
    }

    public ChannelReader<Guid> Reader => _channel.Reader;
}
