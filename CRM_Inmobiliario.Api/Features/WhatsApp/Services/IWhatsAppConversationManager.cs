using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.Extensions.AI;
using System.Collections.Generic;

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
    Task RecordTokenUsageAsync(Guid contactoId, int totalTokens, int inputTokens, int cachedTokens, int outputTokens, string provider = "OpenAI");
    void ApplyNuevaBusqueda(List<ChatMessage> history);
}
