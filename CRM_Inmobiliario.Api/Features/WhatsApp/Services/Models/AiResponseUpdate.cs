namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

public class AiResponseUpdate
{
    public string? TextUpdate { get; set; }
    public AiToolCall? ToolCallUpdate { get; set; }
    public string? FinishReason { get; set; }
    public string? AudioTranscription { get; set; }
    
    // Token tracking
    public int? InputTokens { get; set; }
    public int? CachedTokens { get; set; }
    public int? OutputTokens { get; set; }
    public int? TotalTokens { get; set; }
}
