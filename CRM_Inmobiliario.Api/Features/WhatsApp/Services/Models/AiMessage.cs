namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

public class AiMessage
{
    public string Role { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public List<AiMessagePart> Parts { get; set; } = new();
    public string? ToolCallId { get; set; }
    public List<AiToolCall>? ToolCalls { get; set; }
}

public class AiMessagePart
{
    public string Type { get; set; } = "text"; // "text", "audio"
    public string? Text { get; set; }
    public string? MimeType { get; set; }
    [System.Text.Json.Serialization.JsonIgnore]
    public byte[]? InlineData { get; set; }
    public string? MediaUrl { get; set; }
}
