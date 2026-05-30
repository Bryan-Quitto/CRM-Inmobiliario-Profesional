using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Google.GenAI.Types;

namespace CRM_Inmobiliario.Api.Features.AI.Services;

public class GeminiApiClient : IGeminiApiClient
{
    private readonly HttpClient _httpClient;

    public GeminiApiClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<bool> PatchTtlAsync(string geminiCacheId, string byokKey, CancellationToken cancellationToken = default)
    {
        var patchPayload = new { ttl = "3600s" };
        var jsonContent = JsonContent.Create(patchPayload);

        var request = new HttpRequestMessage(HttpMethod.Patch, 
            $"https://generativelanguage.googleapis.com/v1beta/{geminiCacheId}?updateMask=ttl");

        request.Headers.Add("x-goog-api-key", byokKey);
        request.Content = jsonContent;

        var response = await _httpClient.SendAsync(request, cancellationToken);
        return response.IsSuccessStatusCode;
    }

    public async Task<string?> CreateCachedContentAsync(string byokKey, Content? systemInstruction, List<Content> contents, string model = "models/gemini-2.5-flash", CancellationToken cancellationToken = default)
    {
        var payload = new 
        {
            model = model,
            systemInstruction = systemInstruction,
            contents = contents,
            ttl = "3600s"
        };
        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase, DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull };
        var jsonContent = JsonContent.Create(payload, null, options);

        var request = new HttpRequestMessage(HttpMethod.Post, 
            "https://generativelanguage.googleapis.com/v1beta/cachedContents");
        request.Headers.Add("x-goog-api-key", byokKey);
        request.Content = jsonContent;

        var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync();
            return null;
        }

        var json = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
        if (json.TryGetProperty("name", out var nameProp))
        {
            return nameProp.GetString();
        }
        return null;
    }
}
