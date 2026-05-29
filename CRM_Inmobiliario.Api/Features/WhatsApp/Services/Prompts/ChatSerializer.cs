using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;

public static class ChatSerializer
{
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public static string SerializeHistory(List<AiMessage> history)
    {
        return JsonSerializer.Serialize(history, _jsonOptions);
    }

    public static List<AiMessage> DeserializeHistory(string json, bool leadExists, string? leadName, bool isFirstMessage = false)
    {
        var history = JsonSerializer.Deserialize<List<AiMessage>>(json, _jsonOptions) ?? new List<AiMessage>();
        var systemPrompt = SystemPromptFactory.GetSystemPrompt(leadExists, leadName, isFirstMessage);
        
        foreach (var msg in history)
        {
            if ((msg.Parts == null || msg.Parts.Count == 0) && !string.IsNullOrEmpty(msg.Content))
            {
                msg.Parts ??= new List<AiMessagePart>();
                msg.Parts.Add(new AiMessagePart { Type = "text", Text = msg.Content });
            }
        }

        if (history.Count == 0 || history[0].Role != "system")
        {
            history.Insert(0, new AiMessage 
            { 
                Role = "system", 
                Content = systemPrompt,
                Parts = new List<AiMessagePart> { new AiMessagePart { Type = "text", Text = systemPrompt } }
            });
        }
        else
        {
            history[0].Content = systemPrompt;
            if (history[0].Parts.Count > 0)
            {
                history[0].Parts[0].Text = systemPrompt;
            }
            else
            {
                history[0].Parts.Add(new AiMessagePart { Type = "text", Text = systemPrompt });
            }
        }

        return history;
    }
}
