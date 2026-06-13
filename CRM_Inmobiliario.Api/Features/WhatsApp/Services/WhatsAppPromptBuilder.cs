using Microsoft.Extensions.AI;
using System.Collections.Generic;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;
using System.Text.Json;
using System.Linq;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

/// <summary>
/// Facade for building AI prompts and managing chat history serialization.
/// Delegates specialized logic to factory classes in the Prompts namespace.
/// </summary>
public sealed class WhatsAppPromptBuilder : IWhatsAppPromptBuilder
{
    public string GetSystemPrompt(bool leadExists, string? leadName = null, bool isFirstMessage = false, string? corporateContext = null, string? personalContext = null) 
        => SystemPromptFactory.GetSystemPrompt(leadExists, leadName, isFirstMessage, corporateContext, personalContext);

    public ChatOptions GetChatOptions()
    {
        var options = new ChatOptions
        {
            MaxOutputTokens = 500,
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
            if (m.Role == ChatRole.System) aiHistory.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "system", Content = m.Text ?? "" });
            else if (m.Role == ChatRole.User) aiHistory.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "user", Content = m.Text ?? "" });
            else if (m.Role == ChatRole.Assistant) 
            {
                var am = new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "assistant", Content = m.Text ?? "" };
                
                var functionCalls = m.Contents.OfType<FunctionCallContent>().ToList();
                if (functionCalls.Count > 0)
                {
                    am.ToolCalls = new List<CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall>();
                    foreach(var fc in functionCalls)
                    {
                        am.ToolCalls.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall { Id = fc.CallId, Name = fc.Name, Arguments = JsonSerializer.Serialize(fc.Arguments) });
                    }
                }
                aiHistory.Add(am);
            }
            else if (m.Role == ChatRole.Tool)
            {
                var fr = m.Contents.OfType<FunctionResultContent>().FirstOrDefault();
                aiHistory.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "tool", Content = m.Text ?? "", ToolCallId = fr?.CallId ?? "" });
            }
        }
        return ChatSerializer.SerializeHistory(aiHistory);
    }

    public List<ChatMessage> DeserializeHistory(string json, bool leadExists, string? leadName, bool isFirstMessage = false, string? corporateContext = null, string? personalContext = null) 
    {
        var aiHistory = ChatSerializer.DeserializeHistory(json, leadExists, leadName, isFirstMessage, corporateContext, personalContext);
        var history = new List<ChatMessage>();
        foreach (var m in aiHistory)
        {
            if (m.Role == "system") history.Add(new ChatMessage(ChatRole.System, m.Content));
            else if (m.Role == "user") history.Add(new ChatMessage(ChatRole.User, m.Content));
            else if (m.Role == "assistant")
            {
                var msg = new ChatMessage(ChatRole.Assistant, m.Content);
                if (m.ToolCalls != null && m.ToolCalls.Count > 0)
                {
                    foreach (var tc in m.ToolCalls)
                    {
                        var args = string.IsNullOrEmpty(tc.Arguments) ? null : JsonSerializer.Deserialize<IDictionary<string, object?>>(tc.Arguments);
                        msg.Contents.Add(new FunctionCallContent(tc.Id, tc.Name, args));
                    }
                }
                history.Add(msg);
            }
            else if (m.Role == "tool")
            {
                history.Add(new ChatMessage(ChatRole.Tool, m.Content) { Contents = { new FunctionResultContent(m.ToolCallId ?? string.Empty, m.Content) } });
            }
        }
        return history;
    }
}
