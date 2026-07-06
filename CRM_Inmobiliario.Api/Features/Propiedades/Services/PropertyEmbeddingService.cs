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
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades.Services;

public interface IPropertyEmbeddingService
{
    Task<Vector?> GenerateEmbeddingForPropertyAsync(Property property);
    Task<Vector?> GenerateEmbeddingAsync(string text, string provider = "OpenAI", string? apiKey = null);
}

public sealed class PropertyEmbeddingService : IPropertyEmbeddingService
{
    private readonly string? _envOpenAiApiKey;
    private readonly string? _envGeminiApiKey;
    private readonly LLMSettings _settings;

    private readonly System.Net.Http.IHttpClientFactory _httpClientFactory;
    private readonly CrmDbContext _dbContext;
    private readonly ILogger<PropertyEmbeddingService> _logger;

    public PropertyEmbeddingService(
        System.Net.Http.IHttpClientFactory httpClientFactory, 
        IOptions<LLMSettings> settings,
        CrmDbContext dbContext,
        ILogger<PropertyEmbeddingService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _settings = settings.Value;
        _dbContext = dbContext;
        _logger = logger;
        _envOpenAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
        _envGeminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")?.Trim().Trim('"');
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

        var adminAgent = await _dbContext.Agents.FindAsync(Guid.Parse("d4a6efdd-b801-40fb-901e-64e36f6b1400"));
        string? _openAiApiKey = _envOpenAiApiKey;
        string? _geminiApiKey = _envGeminiApiKey;
        string openAiSource = ".env";
        string geminiSource = ".env";

        if (adminAgent != null && !string.IsNullOrEmpty(adminAgent.AiApiKey))
        {
            if (adminAgent.ActiveLLMProvider == "OpenAI")
            {
                _openAiApiKey = adminAgent.AiApiKey;
                openAiSource = "Admin";
            }
            else if (adminAgent.ActiveLLMProvider == "Gemini")
            {
                _geminiApiKey = adminAgent.AiApiKey;
                geminiSource = "Admin";
            }
        }

        bool generatedAny = false;

        // Intentar generar vector de OpenAI
        string openAiFinalSource = (provider == "OpenAI" && !string.IsNullOrEmpty(apiKey)) ? "Agente Propiedad" : openAiSource;
        string? openAiKey = (provider == "OpenAI" && !string.IsNullOrEmpty(apiKey)) ? apiKey : _openAiApiKey;
        if (property.VectorEmbedding == null && !string.IsNullOrEmpty(openAiKey))
        {
            _logger.LogInformation("Attempting OpenAI embedding for property {PropertyId}. Source: {Source}", property.Id, openAiFinalSource);
            var openAiVector = await GenerateEmbeddingAsync(textToEmbed, "OpenAI", openAiKey);
            if (openAiVector == null && openAiKey != _openAiApiKey && !string.IsNullOrEmpty(_openAiApiKey))
            {
                _logger.LogInformation("Agente OpenAI embedding failed, falling back to Source: {Source} for property {PropertyId}", openAiSource, property.Id);
                openAiVector = await GenerateEmbeddingAsync(textToEmbed, "OpenAI", _openAiApiKey);
            }
            if (openAiVector != null)
            {
                property.VectorEmbedding = openAiVector;
                generatedAny = true;
            }
        }

        // Intentar generar vector de Gemini
        string geminiFinalSource = (provider == "Gemini" && !string.IsNullOrEmpty(apiKey)) ? "Agente Propiedad" : geminiSource;
        string? geminiKey = (provider == "Gemini" && !string.IsNullOrEmpty(apiKey)) ? apiKey : _geminiApiKey;
        if (property.GeminiEmbedding == null && !string.IsNullOrEmpty(geminiKey))
        {
            _logger.LogInformation("Attempting Gemini embedding for property {PropertyId}. Source: {Source}", property.Id, geminiFinalSource);
            var geminiVector = await GenerateEmbeddingAsync(textToEmbed, "Gemini", geminiKey);
            if (geminiVector == null && geminiKey != _geminiApiKey && !string.IsNullOrEmpty(_geminiApiKey))
            {
                _logger.LogInformation("Agente Gemini embedding failed, falling back to Source: {Source} for property {PropertyId}", geminiSource, property.Id);
                geminiVector = await GenerateEmbeddingAsync(textToEmbed, "Gemini", _geminiApiKey);
            }
            if (geminiVector != null)
            {
                property.GeminiEmbedding = geminiVector;
                generatedAny = true;
            }
        }

        // Para retrocompatibilidad con posibles métodos que esperen un Vector (aunque en el job no se usa el valor de retorno real más que para saber si hubo éxito)
        return generatedAny ? (provider == "Gemini" ? property.GeminiEmbedding : property.VectorEmbedding) : null;
    }

    public async Task<Vector?> GenerateEmbeddingAsync(string text, string provider = "OpenAI", string? apiKey = null)
    {
        if (provider == "Gemini")
        {
            var key = (apiKey ?? _envGeminiApiKey)?.Trim();
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
                _logger.LogError("Gemini Embedding Error. StatusCode: {StatusCode}", response.StatusCode);
            }
            return null;
        }
        else
        {
            var key = (apiKey ?? _envOpenAiApiKey)?.Trim();
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
