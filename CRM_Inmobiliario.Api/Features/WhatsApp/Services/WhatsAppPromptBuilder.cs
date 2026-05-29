using OpenAI.Chat;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

/// <summary>
/// Facade for building AI prompts and managing chat history serialization.
/// Delegates specialized logic to factory classes in the Prompts namespace.
/// </summary>
public sealed class WhatsAppPromptBuilder : IWhatsAppPromptBuilder
{
    public string GetSystemPrompt(bool leadExists, string? leadName = null, bool isFirstMessage = false) 
        => SystemPromptFactory.GetSystemPrompt(leadExists, leadName, isFirstMessage);

    public ChatCompletionOptions GetChatOptions()
    {
        var options = new ChatCompletionOptions
        {
            MaxOutputTokenCount = 500,
            PresencePenalty = 0.6f,
            FrequencyPenalty = 0.5f
        };
        return options;
    }

    public string SerializeHistory(List<ChatMessage> history) 
    {
        var aiHistory = new List<CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage>();
        foreach(var m in history)
        {
            if (m is SystemChatMessage scm) aiHistory.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "system", Content = scm.Content.Count > 0 ? scm.Content[0].Text : "" });
            else if (m is UserChatMessage ucm) aiHistory.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "user", Content = ucm.Content.Count > 0 ? ucm.Content[0].Text : "" });
            else if (m is AssistantChatMessage acm) 
            {
                var am = new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "assistant" };
                if (acm.ToolCalls != null && acm.ToolCalls.Count > 0)
                {
                    am.ToolCalls = new List<CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall>();
                    foreach(var tc in acm.ToolCalls)
                    {
                        am.ToolCalls.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall { Id = tc.Id, Name = tc.FunctionName, Arguments = tc.FunctionArguments.ToString() });
                    }
                }
                else
                {
                    am.Content = acm.Content.Count > 0 ? acm.Content[0].Text : "";
                }
                aiHistory.Add(am);
            }
            else if (m is ToolChatMessage tcm)
            {
                aiHistory.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "tool", Content = tcm.Content.Count > 0 ? tcm.Content[0].Text : "", ToolCallId = tcm.ToolCallId });
            }
        }
        return ChatSerializer.SerializeHistory(aiHistory);
    }

    public List<ChatMessage> DeserializeHistory(string json, bool leadExists, string? leadName, bool isFirstMessage = false) 
    {
        var aiHistory = ChatSerializer.DeserializeHistory(json, leadExists, leadName, isFirstMessage);
        var history = new List<ChatMessage>();
        foreach (var m in aiHistory)
        {
            if (m.Role == "system") history.Add(new SystemChatMessage(m.Content));
            else if (m.Role == "user") history.Add(new UserChatMessage(m.Content));
            else if (m.Role == "assistant")
            {
                if (m.ToolCalls != null && m.ToolCalls.Count > 0)
                {
                    var toolCalls = new List<ChatToolCall>();
                    foreach (var tc in m.ToolCalls)
                    {
                        toolCalls.Add(ChatToolCall.CreateFunctionToolCall(tc.Id, tc.Name, BinaryData.FromString(tc.Arguments)));
                    }
                    history.Add(new AssistantChatMessage(toolCalls));
                }
                else
                {
                    history.Add(new AssistantChatMessage(m.Content));
                }
            }
            else if (m.Role == "tool")
            {
                history.Add(new ToolChatMessage(m.ToolCallId, m.Content));
            }
        }
        return history;
    }
}
