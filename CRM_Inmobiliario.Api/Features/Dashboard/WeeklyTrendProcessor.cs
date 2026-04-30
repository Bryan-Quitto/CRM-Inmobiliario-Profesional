using System;
using System.Collections.Generic;
using System.Linq;

namespace CRM_Inmobiliario.Api.Features.Dashboard;

public static class WeeklyTrendProcessor
{
    public static List<WeeklyTrendPoint> CalculateTrends(
        DateTimeOffset nowEcuador, 
        TimeSpan ecuadorOffset, 
        List<DateTimeOffset> rawVisitas, 
        List<DateTimeOffset> rawCierres, 
        List<DateTimeOffset> rawCaptaciones)
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
            if (i == 0 && duracion < 4 && semanas.Count > 1) { semanas[i + 1] = (s.Inicio, semanas[i + 1].Fin); continue; }
            if (i == semanas.Count - 1 && duracion < 4 && semanasFinales.Count > 0) { semanasFinales[^1] = (semanasFinales[^1].Inicio, s.Fin); continue; }
            semanasFinales.Add(s);
        }

        var trendSemanas = new List<WeeklyTrendPoint>();
        for (int i = 0; i < semanasFinales.Count; i++)
        {
            var s = semanasFinales[i];
            // IMPORTANTE: Al comparar, pasamos el dato de DB (UTC) al offset de Ecuador para que el día coincida con el calendario local
            var vCount = rawVisitas.Count(x => x.ToOffset(ecuadorOffset).Date >= s.Inicio.Date && x.ToOffset(ecuadorOffset).Date <= s.Fin.Date);
            var cCount = rawCierres.Count(x => x.ToOffset(ecuadorOffset).Date >= s.Inicio.Date && x.ToOffset(ecuadorOffset).Date <= s.Fin.Date);
            var capCount = rawCaptaciones.Count(x => x.ToOffset(ecuadorOffset).Date >= s.Inicio.Date && x.ToOffset(ecuadorOffset).Date <= s.Fin.Date);

            trendSemanas.Add(new WeeklyTrendPoint($"S{i + 1}", vCount, cCount, capCount));
        }

        return trendSemanas;
    }
}
