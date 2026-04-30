using OpenAI.Chat;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

/// <summary>
/// Facade for building AI prompts and managing chat history serialization.
/// Delegates specialized logic to factory classes in the Prompts namespace.
/// </summary>
public sealed class WhatsAppPromptBuilder : IWhatsAppPromptBuilder
{
    public string GetSystemPrompt(bool leadExists, string? leadName = null) 
        => SystemPromptFactory.GetSystemPrompt(leadExists, leadName);

    public ChatCompletionOptions GetChatOptions()
    {
        var options = new ChatCompletionOptions
        {
            MaxOutputTokenCount = 500,
            PresencePenalty = 0.6f,
            FrequencyPenalty = 0.5f
        };

        AiToolDefinitions.AddTools(options);

        return options;
    }

    public string SerializeHistory(List<ChatMessage> history) 
        => ChatSerializer.SerializeHistory(history);

    public List<ChatMessage> DeserializeHistory(string json, bool leadExists, string? leadName) 
        => ChatSerializer.DeserializeHistory(json, leadExists, leadName);
}
