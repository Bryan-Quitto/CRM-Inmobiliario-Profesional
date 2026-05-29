using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public class LLMProviderFactory
{
    private readonly OpenAiProvider _openAiProvider;
    private readonly GeminiProvider _geminiProvider;

    public LLMProviderFactory(OpenAiProvider openAiProvider, GeminiProvider geminiProvider)
    {
        _openAiProvider = openAiProvider;
        _geminiProvider = geminiProvider;
    }

    public ILLMProvider GetProvider(string apiKey)
    {
        if (apiKey.StartsWith("AIza"))
            return _geminiProvider;
        return _openAiProvider;
    }
}
