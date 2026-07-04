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
    Task<Contacto?> GetOrCreateContactAsync(string phone, string phoneNumberId, bool autoCreate, CancellationToken cancellationToken = default);
    Task<WhatsAppContext> PrepareContextAsync(Contacto? contacto, string phone, string messageText, string phoneNumberId, CancellationToken cancellationToken = default);
    Task SaveStateAsync(Guid contactoId, List<ChatMessage> history, CancellationToken cancellationToken = default);
    Task LogMessageAsync(Guid contactoId, string phone, string role, string content, CancellationToken cancellationToken = default);
    Task RecordTokenUsageAsync(Guid agentId, Guid contactoId, int totalTokens, int inputTokens, int cachedTokens, int outputTokens, string provider = "OpenAI", CancellationToken cancellationToken = default);
    void ApplyNuevaBusqueda(List<ChatMessage> history);
}
