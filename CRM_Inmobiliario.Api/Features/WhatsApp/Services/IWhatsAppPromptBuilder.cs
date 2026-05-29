using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppPromptBuilder
{
    string GetSystemPrompt(bool leadExists, string? leadName = null, bool isFirstMessage = false);
    ChatCompletionOptions GetChatOptions();
    string SerializeHistory(List<ChatMessage> history);
    List<ChatMessage> DeserializeHistory(string json, bool leadExists, string? leadName, bool isFirstMessage = false);
}
