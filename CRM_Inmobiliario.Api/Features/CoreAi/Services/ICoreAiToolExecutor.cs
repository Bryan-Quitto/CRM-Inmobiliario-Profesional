using System;
using System.Text.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Services;

public class ToolExecutionContext
{
    public Guid UserId { get; set; } // Puede ser ContactoId o AgentId
    public string Channel { get; set; } = null!; // "WhatsApp" o "Copilot"
    public string TriggerMessage { get; set; } = null!;
    public string? CustomerPhone { get; set; } // Si es WhatsApp
    public string? PhoneNumberId { get; set; } // Si es WhatsApp
    public Contacto? Contacto { get; set; } // Opcional, si estamos en contexto WhatsApp
}

public interface ICoreAiToolExecutor
{
    Task<string> HandleToolCallAsync(AiToolCall toolCall, ToolExecutionContext context);
}
