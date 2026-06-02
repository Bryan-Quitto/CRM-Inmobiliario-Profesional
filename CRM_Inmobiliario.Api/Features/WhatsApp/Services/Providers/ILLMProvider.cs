using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;

public interface ILLMProvider
{
    IAsyncEnumerable<AiResponseUpdate> StreamChatAsync(List<AiMessage> history, List<AiToolDefinition> tools, string? cachedContentId = null, int? maxTokens = null, CancellationToken cancellationToken = default);
    Task<T?> GetStructuredResponseAsync<T>(List<AiMessage> history, CancellationToken cancellationToken);
}
