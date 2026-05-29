namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

public class AiResponseUpdate
{
    public string? TextUpdate { get; set; }
    public AiToolCall? ToolCallUpdate { get; set; }
    public string? FinishReason { get; set; }
    public string? AudioTranscription { get; set; }
}
