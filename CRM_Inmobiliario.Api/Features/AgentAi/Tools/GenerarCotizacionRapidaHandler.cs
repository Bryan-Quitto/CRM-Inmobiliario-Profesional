using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Tools;

public sealed class GenerarCotizacionRapidaHandler : ICoreAiToolHandler
{
    private readonly IFinancialRateRepository _rateRepository;
    private readonly ILogger<GenerarCotizacionRapidaHandler> _logger;

    public GenerarCotizacionRapidaHandler(
        IFinancialRateRepository rateRepository,
        ILogger<GenerarCotizacionRapidaHandler> logger)
    {
        _rateRepository = rateRepository;
        _logger = logger;
    }

    public string ToolName => "GenerarCotizacionRapida";

    public async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context)
    {
        _logger.LogInformation("Iniciando generación de cotización rápida.");

        decimal montoPropiedad = 0;
        decimal enganche = 0;

        if (args.RootElement.TryGetProperty("montoPropiedad", out var mpProp) && mpProp.TryGetDecimal(out var mp))
        {
            montoPropiedad = mp;
        }

        if (args.RootElement.TryGetProperty("enganche", out var engProp) && engProp.TryGetDecimal(out var eng))
        {
            enganche = eng;
        }

        if (montoPropiedad <= 0)
        {
            return "No se especificó un monto válido para la propiedad.";
        }

        var rates = await _rateRepository.GetCurrentRatesAsync();
        if (rates == null || rates.PlazosDisponibles == null || rates.PlazosDisponibles.Length == 0)
        {
            return "No hay tasas financieras disponibles en este momento. Informa al usuario.";
        }

        decimal montoPrestamo = montoPropiedad - enganche;
        if (montoPrestamo <= 0)
        {
            return "El monto de préstamo calculado es inválido. Verifica el enganche.";
        }

        var response = new CotizacionResponse
        {
            TasaInteresAplicada = rates.TasaInteresAnual,
            Proyecciones = new List<ProyeccionPlazo>()
        };

        decimal tasaMensual = (rates.TasaInteresAnual / 100m) / 12m;

        foreach (var plazoMeses in rates.PlazosDisponibles)
        {
            decimal pagoMensual = 0;
            if (tasaMensual > 0)
            {
                // PMT formula: P = L * [c(1 + c)^n] / [(1 + c)^n - 1]
                decimal c = tasaMensual;
                double n = plazoMeses;
                decimal factor = (decimal)Math.Pow((double)(1 + c), n);
                pagoMensual = montoPrestamo * (c * factor) / (factor - 1);
            }
            else
            {
                pagoMensual = montoPrestamo / plazoMeses;
            }

            response.Proyecciones.Add(new ProyeccionPlazo
            {
                Meses = plazoMeses,
                PagoMensual = Math.Round(pagoMensual, 2)
            });
        }

        return JsonSerializer.Serialize(response);
    }
}

public class CotizacionResponse 
{
    public decimal TasaInteresAplicada { get; set; }
    public List<ProyeccionPlazo> Proyecciones { get; set; } = new();
}

public class ProyeccionPlazo 
{
    public int Meses { get; set; }
    public decimal PagoMensual { get; set; }
}
