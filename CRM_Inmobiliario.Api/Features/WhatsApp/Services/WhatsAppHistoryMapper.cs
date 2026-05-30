using System.Collections.Generic;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public static class WhatsAppHistoryMapper
{
    public static List<AiMessage> MapToAiHistory(List<ChatMessage> history, byte[]? audioBytes, string? mediaUrl)
    {
        var aiHistory = new List<AiMessage>();
        foreach(var m in history)
        {
            if (m is SystemChatMessage scm) 
                aiHistory.Add(new AiMessage { Role = "system", Content = scm.Content.Count > 0 ? scm.Content[0].Text : "" });
            else if (m is UserChatMessage ucm) 
            {
                var text = ucm.Content.Count > 0 ? ucm.Content[0].Text : "";
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
            else if (m is AssistantChatMessage acm) 
            {
                var am = new AiMessage { Role = "assistant" };
                if (acm.ToolCalls != null && acm.ToolCalls.Count > 0)
                {
                    am.ToolCalls = new List<AiToolCall>();
                    foreach(var tc in acm.ToolCalls)
                    {
                        am.ToolCalls.Add(new AiToolCall { Id = tc.Id, Name = tc.FunctionName, Arguments = tc.FunctionArguments.ToString() });
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
                aiHistory.Add(new AiMessage { Role = "tool", Content = tcm.Content.Count > 0 ? tcm.Content[0].Text : "", ToolCallId = tcm.ToolCallId });
            }
        }
        return aiHistory;
    }
}
