using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.Extensions.AI;
using OpenAI;
using Pgvector;
using System.Threading.Tasks;
using System;
using System.Net.Http.Json;
using System.Linq;
using Microsoft.Extensions.Options;
using CRM_Inmobiliario.Api.Features.Shared.Settings;

namespace CRM_Inmobiliario.Api.Features.Propiedades.Services;

public interface IPropertyEmbeddingService
{
    Task<Vector?> GenerateEmbeddingForPropertyAsync(Property property);
    Task<Vector?> GenerateEmbeddingAsync(string text, string provider = "OpenAI", string? apiKey = null);
}

public sealed class PropertyEmbeddingService : IPropertyEmbeddingService
{
    private readonly string? _openAiApiKey;
    private readonly string? _geminiApiKey;
    private readonly LLMSettings _settings;

    private readonly System.Net.Http.IHttpClientFactory _httpClientFactory;

    public PropertyEmbeddingService(System.Net.Http.IHttpClientFactory httpClientFactory, IOptions<LLMSettings> settings)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
        _geminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")?.Trim().Trim('"');
    }

    public async Task<Vector?> GenerateEmbeddingForPropertyAsync(Property property)
    {
        var textToEmbed = $"[{property.TipoPropiedad}] en [{property.Sector}, {property.Ciudad}]. " +
                          $"Operación: {property.Operacion}. " +
                          $"Precio: ${property.Precio}. " +
                          $"{property.Habitaciones} Habitaciones, {property.Banos} Baños. " +
                          $"Área Total: {property.AreaTotal} m2. " +
                          $"Descripción: {property.Titulo} - {property.Descripcion}";

        string provider = string.IsNullOrEmpty(property.Agente?.ActiveLLMProvider) ? "Gemini" : property.Agente.ActiveLLMProvider;
        string? apiKey = property.Agente?.AiApiKey;

        var vector = await GenerateEmbeddingAsync(textToEmbed, provider, apiKey);
        
        if (vector != null)
        {
            if (provider == "Gemini") property.GeminiEmbedding = vector;
            else property.VectorEmbedding = vector;
        }

        return vector;
    }

    public async Task<Vector?> GenerateEmbeddingAsync(string text, string provider = "OpenAI", string? apiKey = null)
    {
        if (provider == "Gemini")
        {
            var key = apiKey ?? _geminiApiKey;
            if (string.IsNullOrEmpty(key)) return null;

            var model = _settings.Gemini.DefaultEmbeddingModel ?? "gemini-embedding-2";

            // Generating embedding with Gemini
            // We use the REST API via HttpClient
            var req = new { 
                model = $"models/{model}",
                content = new { parts = new[] { new { text = text } } },
                outputDimensionality = 768
            };
            // Let's use a standard HttpClient for simplicity since Google.GenAI SDK might differ or be unavailable.
            using var httpClient = _httpClientFactory.CreateClient("Gemini");
            var response = await httpClient.PostAsJsonAsync($"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent?key={key}", req);
            if (response.IsSuccessStatusCode)
            {
                var doc = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonDocument>();
                var values = doc?.RootElement.GetProperty("embedding").GetProperty("values").EnumerateArray().Select(x => x.GetSingle()).ToArray();
                if (values != null) return new Vector(values);
            }
            else
            {
                var errorText = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[Gemini Embedding Error] StatusCode: {response.StatusCode}, Content: {errorText}");
            }
            return null;
        }
        else
        {
            var key = apiKey ?? _openAiApiKey;
            if (string.IsNullOrEmpty(key)) return null;
            var model = _settings.OpenAI.DefaultEmbeddingModel ?? "text-embedding-3-small";

            var embeddingClient = new OpenAI.Embeddings.EmbeddingClient(model, key);
            var result = await embeddingClient.GenerateEmbeddingAsync(text);

            if (result.Value != null)
            {
                return new Vector(result.Value.ToFloats().ToArray());
            }

            return null;
        }
    }
}
