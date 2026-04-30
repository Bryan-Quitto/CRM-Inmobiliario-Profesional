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

            // Si la primera semana es muy corta, fusionarla con la siguiente
            if (i == 0 && duracion < 4 && semanas.Count > 1)
            {
                semanas[i + 1] = (s.Inicio, semanas[i + 1].Fin);
                continue;
            }
            
            // Si la última semana es muy corta, fusionarla con la anterior
            if (i == semanas.Count - 1 && duracion < 4 && semanasFinales.Count > 0)
            {
                var anterior = semanasFinales[^1];
                semanasFinales[^1] = (anterior.Inicio, s.Fin);
                continue;
            }

            semanasFinales.Add(s);
        }

        return semanasFinales;
    }
}
