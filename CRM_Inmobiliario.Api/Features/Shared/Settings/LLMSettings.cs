namespace CRM_Inmobiliario.Api.Features.Shared.Settings;

public class LLMSettings
{
    public const string SectionName = "LLMSettings";

    public OpenAiSettings OpenAI { get; set; } = new();
    public GeminiSettings Gemini { get; set; } = new();
}

public class OpenAiSettings
{
    public string DefaultChatModel { get; set; } = "gpt-4o-mini";
    public string DefaultEmbeddingModel { get; set; } = "text-embedding-3-small";
    public string DefaultAudioModel { get; set; } = "whisper-1";
}

public class GeminiSettings
{
    public string DefaultChatModel { get; set; } = "gemini-2.5-flash";
    public string DefaultEmbeddingModel { get; set; } = "gemini-embedding-2";
}
