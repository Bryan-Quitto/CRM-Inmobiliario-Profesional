using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;

public interface ILLMProvider
{
    IAsyncEnumerable<AiResponseUpdate> StreamChatAsync(List<AiMessage> history, List<AiToolDefinition> tools, string apiKey);
}
