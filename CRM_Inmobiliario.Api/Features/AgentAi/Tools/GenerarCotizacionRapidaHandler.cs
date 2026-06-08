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
    private readonly ILogger<GenerarCotizacionRapidaHandler> _logger;

    public GenerarCotizacionRapidaHandler(
        ILogger<GenerarCotizacionRapidaHandler> logger)
    {
        _logger = logger;
    }

    public string ToolName => "GenerarCotizacionRapida";

    public async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Iniciando generación de cotización rápida. Argumentos RAW: {Args}", args.RootElement.GetRawText());

        decimal montoPropiedad = 0;
        decimal enganche = 0;
        decimal tasaInteresAnual = 0;
        int[] plazosDisponibles = Array.Empty<int>();

        decimal GetDecimalFromJson(JsonElement element, string propertyName)
        {
            if (element.TryGetProperty(propertyName, out var prop))
            {
                if (prop.ValueKind == JsonValueKind.Number && prop.TryGetDecimal(out var val)) return val;
                if (prop.ValueKind == JsonValueKind.String)
                {
                    string strVal = prop.GetString()?.Replace("%", "").Trim() ?? "";
                    if (decimal.TryParse(strVal, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var sVal)) return sVal;
                }
            }
            return 0;
        }

        montoPropiedad = GetDecimalFromJson(args.RootElement, "montoPropiedad");
        enganche = GetDecimalFromJson(args.RootElement, "enganche");
        tasaInteresAnual = GetDecimalFromJson(args.RootElement, "tasaInteresAnual");
        
        if (args.RootElement.TryGetProperty("plazosMeses", out var plazosProp) && plazosProp.ValueKind == JsonValueKind.Array)
        {
            var plazos = new List<int>();
            foreach (var element in plazosProp.EnumerateArray())
            {
                if (element.ValueKind == JsonValueKind.Number && element.TryGetInt32(out var p)) plazos.Add(p);
                else if (element.ValueKind == JsonValueKind.String && int.TryParse(element.GetString(), out var sp)) plazos.Add(sp);
            }
            plazosDisponibles = plazos.ToArray();
        }

        // VALIDACIONES DE SEGURIDAD / LEGALES CONTRA ALUCINACIONES DEL LLM
        if (montoPropiedad <= 0) return "Error: No se especificó un monto válido para la propiedad.";
        if (enganche < 0) return "Error: El enganche no puede ser negativo.";
        if (tasaInteresAnual <= 0 || tasaInteresAnual > 25) return "Error Crítico: La tasa de interés provista por el RAG es irreal (fuera del rango 1%-25%). Verifica la extracción del documento.";
        if (plazosDisponibles.Length == 0) return "Error: No se proporcionaron plazos válidos en meses (ej. [240, 360]) extraídos del documento.";

        decimal montoPrestamo = montoPropiedad - enganche;
        if (montoPrestamo <= 0) return "Error: El monto de préstamo calculado es inválido. Verifica el enganche.";

        var response = new CotizacionResponse
        {
            TasaInteresAplicada = tasaInteresAnual,
            Proyecciones = new List<ProyeccionPlazo>()
        };

        decimal tasaMensual = (tasaInteresAnual / 100m) / 12m;

        foreach (var plazoMeses in plazosDisponibles)
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

        string jsonResponse = JsonSerializer.Serialize(response);
        string avisoLegal = "\n\nINSTRUCCIÓN CRÍTICA PARA LA IA: Debes copiar y pegar el siguiente texto EXACTAMENTE al final de tu respuesta al usuario, sin omitir ni una letra:\n\n🚨 *Aviso Legal:* Los valores presentados son proyecciones referenciales basadas en los tarifarios públicos actuales y no constituyen una pre-aprobación crediticia. Las tasas definitivas (VIS/VIP/Normal), plazos y porcentajes de entrada están sujetos al análisis de riesgo individual, buró de crédito del solicitante y políticas internas de la institución financiera al momento del desembolso. Se recomienda verificar las condiciones finales directamente con un asesor de la entidad.";
        
        return jsonResponse + avisoLegal;
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

