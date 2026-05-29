using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppToolExecutor
{
    Task<string> HandleToolCallAsync(AiToolCall toolCall, string customerPhone, string triggerMessage, Contacto? currentContacto, string phoneNumberId);
}
