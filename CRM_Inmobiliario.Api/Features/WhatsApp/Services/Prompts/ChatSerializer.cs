using OpenAI.Chat;
using System.Text.Json;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts;

public static class ChatSerializer
{
    public static string SerializeHistory(List<ChatMessage> history)
    {
        var dto = history.Select(m => {
            var item = new ChatMessageDto 
            { 
                Role = m is SystemChatMessage ? "system" : 
                       m is UserChatMessage ? "user" : 
                       m is AssistantChatMessage ? "assistant" : 
                       m is ToolChatMessage ? "tool" : "unknown",
                Content = m.Content.Count > 0 ? m.Content[0].Text : ""
            };

            if (m is ToolChatMessage t)
            {
                item.ToolCallId = t.ToolCallId;
            }
            else if (m is AssistantChatMessage a && a.ToolCalls?.Count > 0)
            {
                item.ToolCalls = a.ToolCalls.Select(tc => new ToolCallDto 
                { 
                    Id = tc.Id, 
                    Name = tc.FunctionName, 
                    Arguments = tc.FunctionArguments.ToString() 
                }).ToList();
            }

            return item;
        }).ToList();
        
        return JsonSerializer.Serialize(dto);
    }

    public static List<ChatMessage> DeserializeHistory(string json, bool leadExists, string? leadName)
    {
        var dtos = JsonSerializer.Deserialize<List<ChatMessageDto>>(json) ?? new List<ChatMessageDto>();
        var history = new List<ChatMessage>();

        foreach (var dto in dtos)
        {
            switch (dto.Role)
            {
                case "system": break;
                case "user": history.Add(new UserChatMessage(dto.Content)); break;
                case "assistant": 
                    if (dto.ToolCalls?.Count > 0)
                    {
                        var toolCalls = dto.ToolCalls.Select(tc => ChatToolCall.CreateFunctionToolCall(tc.Id, tc.Name, BinaryData.FromString(tc.Arguments))).ToList();
                        history.Add(new AssistantChatMessage(toolCalls));
                    }
                    else history.Add(new AssistantChatMessage(dto.Content));
                    break;
                case "tool": history.Add(new ToolChatMessage(dto.ToolCallId!, dto.Content)); break;
            }
        }
        history.Insert(0, new SystemChatMessage(SystemPromptFactory.GetSystemPrompt(leadExists, leadName)));
        return history;
    }

    private class ChatMessageDto
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ToolCallId { get; set; }
        public List<ToolCallDto>? ToolCalls { get; set; }
    }

    private class ToolCallDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Arguments { get; set; } = string.Empty;
    }
}
