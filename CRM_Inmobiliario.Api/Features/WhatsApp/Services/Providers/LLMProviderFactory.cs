using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public class LLMProviderFactory
{
    private readonly System.Net.Http.IHttpClientFactory _httpClientFactory;
    private readonly Microsoft.Extensions.Options.IOptions<CRM_Inmobiliario.Api.Features.Shared.Settings.LLMSettings> _settings;

    public LLMProviderFactory(System.Net.Http.IHttpClientFactory httpClientFactory, Microsoft.Extensions.Options.IOptions<CRM_Inmobiliario.Api.Features.Shared.Settings.LLMSettings> settings)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings;
    }

    public virtual ILLMProvider GetProvider(string providerName, string apiKey)
    {
        if (!string.IsNullOrEmpty(apiKey) && (apiKey.StartsWith("AIza", StringComparison.OrdinalIgnoreCase) || apiKey.StartsWith("AQ.", StringComparison.OrdinalIgnoreCase)))
            return new GeminiProvider(_httpClientFactory, _settings, apiKey);
            
        if (string.Equals(providerName, "Gemini", StringComparison.OrdinalIgnoreCase))
            return new GeminiProvider(_httpClientFactory, _settings, apiKey);
            
        return new OpenAiProvider(_httpClientFactory, _settings, apiKey);
    }
}
