using System;

namespace CRM_Inmobiliario.Api.Features.Dashboard;

public static class WarmingDateHelper
{
    public static DateTime GetHoyLimiteUtc(DateTimeOffset nowEcuador, TimeSpan ecuadorOffset)
    {
        // Definimos el fin del día basado en el calendario de Ecuador y luego lo pasamos a UTC para la DB
        var finDelDiaEcuador = new DateTimeOffset(nowEcuador.Year, nowEcuador.Month, nowEcuador.Day, 23, 59, 59, ecuadorOffset);
        return finDelDiaEcuador.ToUniversalTime().UtcDateTime;
    }

    public static (DateTime InicioUtc, DateTime FinUtc) GetMesActualRangosUtc(DateTimeOffset nowEcuador, TimeSpan ecuadorOffset)
    {
        var inicioMesEcuador = new DateTimeOffset(nowEcuador.Year, nowEcuador.Month, 1, 0, 0, 0, ecuadorOffset);
        var finMesEcuador = inicioMesEcuador.AddMonths(1).AddTicks(-1);
        
        return (inicioMesEcuador.ToUniversalTime().UtcDateTime, finMesEcuador.ToUniversalTime().UtcDateTime);
    }
}
