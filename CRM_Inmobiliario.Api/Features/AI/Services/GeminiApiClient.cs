using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;

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
}
