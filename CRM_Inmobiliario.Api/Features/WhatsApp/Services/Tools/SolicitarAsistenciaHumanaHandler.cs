using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class SolicitarAsistenciaHumanaHandler : BaseWhatsAppToolHandler
{
    public SolicitarAsistenciaHumanaHandler(CrmDbContext context, ILogger<SolicitarAsistenciaHumanaHandler> logger) 
        : base(context, logger) { }

    public override string ToolName => "SolicitarAsistenciaHumana";

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Lead? lead)
    {
        string motivo = args.RootElement.TryGetProperty("motivo", out var m) ? m.GetString() ?? "No especificado" : "No especificado";
        await LogAiActionAsync("Alerta", args.RootElement.GetRawText(), phone, triggerMessage, lead?.Id);
        return "Solicitud de asistencia enviada al equipo humano.";
    }
}
