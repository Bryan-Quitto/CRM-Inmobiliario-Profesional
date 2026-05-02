using CRM_Inmobiliario.Api.Domain.Entities;
using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppToolExecutor
{
    Task<string> HandleToolCallAsync(ChatToolCall toolCall, string customerPhone, string triggerMessage, Contacto? currentContacto);
}
