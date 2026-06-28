using System;
using System.Text.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Services;

public class ToolExecutionContext
{
    public Guid UserId { get; set; } // Puede ser ContactoId o AgentId
    public string? Channel { get; set; } // Ej: "WhatsApp", "Facebook"
    public string? ChannelIdentifier { get; set; } // El PSID, Número, etc.
    public string? TriggerMessage { get; set; }
    public string? FocusedContextId { get; set; }
    public string? PhoneNumberId { get; set; } // Si es WhatsApp
    public Guid? ContactoId { get; set; } // Opcional, si estamos en contexto WhatsApp
}

public interface ICoreAiToolExecutor
{
    Task<string> HandleToolCallAsync(AiToolCall toolCall, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default);
}
