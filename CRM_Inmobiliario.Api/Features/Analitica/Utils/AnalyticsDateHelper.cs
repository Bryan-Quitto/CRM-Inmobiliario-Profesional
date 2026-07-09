using System;
using System.Collections.Generic;

namespace CRM_Inmobiliario.Api.Features.Analitica.Utils;

/// <summary>
/// Helper para centralizar la lógica de fechas de analítica, asegurando el cumplimiento
/// del estándar UTC-5 (Ecuador) y la lógica de agrupación por semanas.
/// </summary>
public static class AnalyticsDateHelper
{
    public static readonly TimeSpan EcuadorOffset = TimeSpan.FromHours(-5);

    public static DateTimeOffset GetNowEcuador() => DateTimeOffset.UtcNow.ToOffset(EcuadorOffset);

    public static (DateTimeOffset Inicio, DateTimeOffset Fin) GetCurrentMonthLimitsUtc()
    {
        var nowEcuador = GetNowEcuador();
        
        // Inicio del mes a las 00:00:00 en Ecuador
        var inicioMesEcuador = new DateTimeOffset(nowEcuador.Year, nowEcuador.Month, 1, 0, 0, 0, EcuadorOffset);
        
        // Fin del mes (último tick antes del siguiente mes)
        var finMesEcuador = inicioMesEcuador.AddMonths(1).AddTicks(-1);
        
        return (inicioMesEcuador.ToUniversalTime(), finMesEcuador.ToUniversalTime());
    }

    /// <summary>
    /// Calcula los rangos semanales para el mes actual, fusionando semanas menores a 4 días
    /// para asegurar una visualización de tendencia equilibrada.
    /// </summary>
    public static List<(DateTime Inicio, DateTime Fin)> CalculateWeeklyRanges(DateTimeOffset nowEcuador)
    {
        var primerDia = new DateTime(nowEcuador.Year, nowEcuador.Month, 1);
        var ultimoDiaMes = primerDia.AddMonths(1).AddDays(-1);

        int firstDayOfWeek = (int)primerDia.DayOfWeek; // 0 = Sunday, 1 = Monday...
        int daysToSubtract = firstDayOfWeek == 0 ? 6 : firstDayOfWeek - 1;

        var currentMonday = primerDia.AddDays(-daysToSubtract);
        
        var semanas = new List<(DateTime Inicio, DateTime Fin)>();
        
        while (currentMonday <= ultimoDiaMes)
        {
            var finSemana = currentMonday.AddDays(6);
            semanas.Add((currentMonday, finSemana));
            currentMonday = currentMonday.AddDays(7);
        }

        return semanas;
    }
}
