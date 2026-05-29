using CRM_Inmobiliario.Api.Domain.Entities;
using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public record WhatsAppContext(
    Contacto? Contacto, 
    WhatsappConversation Conversation, 
    List<ChatMessage> History, 
    string? AutoResponse = null,
    bool IsFirstMessage = false);

public interface IWhatsAppConversationManager
{
    Task<WhatsAppContext> PrepareContextAsync(string phone, string messageText, string phoneNumberId);
    Task SaveStateAsync(Guid contactoId, List<ChatMessage> history);
    Task LogMessageAsync(Guid contactoId, string phone, string role, string content);
    Task RecordTokenUsageAsync(Guid contactoId, int tokens);
}
