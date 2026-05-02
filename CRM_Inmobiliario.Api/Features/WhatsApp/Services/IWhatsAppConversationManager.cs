using CRM_Inmobiliario.Api.Domain.Entities;
using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public record WhatsAppContext(
    Contacto? Contacto, 
    WhatsappConversation Conversation, 
    List<ChatMessage> History, 
    string? AutoResponse = null);

public interface IWhatsAppConversationManager
{
    Task<WhatsAppContext> PrepareContextAsync(string phone, string messageText);
    Task SaveStateAsync(string phone, List<ChatMessage> history);
    Task LogMessageAsync(string phone, string role, string content);
}
