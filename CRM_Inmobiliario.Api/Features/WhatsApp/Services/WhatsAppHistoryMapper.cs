using System.Collections.Generic;
using System.Linq;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Microsoft.Extensions.AI;
using System.Text.Json;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public static class WhatsAppHistoryMapper
{
    public static List<AiMessage> MapToAiHistory(List<ChatMessage> history, byte[]? audioBytes, string? mediaUrl)
    {
        var aiHistory = new List<AiMessage>();
        foreach(var m in history)
        {
            if (m.Role == ChatRole.System) 
                aiHistory.Add(new AiMessage { Role = "system", Content = m.Text ?? "" });
            else if (m.Role == ChatRole.User) 
            {
                var text = m.Text ?? "";
                var aiMsg = new AiMessage { Role = "user", Content = text };
                if (audioBytes != null && mediaUrl != null && text == $"[Audio Note: {mediaUrl}]")
                {
                    aiMsg.Parts.Add(new AiMessagePart 
                    { 
                        Type = "audio", 
                        MimeType = "audio/ogg",
                        InlineData = audioBytes,
                        MediaUrl = mediaUrl
                    });
                }
                else
                {
                    aiMsg.Parts.Add(new AiMessagePart { Type = "text", Text = text });
                }
                aiHistory.Add(aiMsg);
            }
            else if (m.Role == ChatRole.Assistant) 
            {
                var am = new AiMessage { Role = "assistant" };
                var functionCalls = m.Contents.OfType<FunctionCallContent>().ToList();
                if (functionCalls.Count > 0)
                {
                    am.ToolCalls = new List<AiToolCall>();
                    foreach(var tc in functionCalls)
                    {
                        am.ToolCalls.Add(new AiToolCall { Id = tc.CallId, Name = tc.Name, Arguments = JsonSerializer.Serialize(tc.Arguments) });
                    }
                }
                else
                {
                    am.Content = m.Text ?? "";
                }
                aiHistory.Add(am);
            }
            else if (m.Role == ChatRole.Tool)
            {
                var fr = m.Contents.OfType<FunctionResultContent>().FirstOrDefault();
                aiHistory.Add(new AiMessage { Role = "tool", Content = m.Text ?? "", ToolCallId = fr?.CallId ?? "" });
            }
        }
        return aiHistory;
    }
}
