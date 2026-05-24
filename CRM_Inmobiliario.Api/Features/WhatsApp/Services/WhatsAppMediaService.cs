using System.Net.Http.Headers;
using System.Text.Json;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppMediaService
{
    Task<Stream> DownloadMediaAsync(string mediaId);
}

public class WhatsAppMediaService : IWhatsAppMediaService
{
    private readonly HttpClient _httpClient;
    private readonly string _accessToken;

    public WhatsAppMediaService(HttpClient httpClient)
    {
        _httpClient = httpClient;
        _accessToken = Environment.GetEnvironmentVariable("WHATSAPP_ACCESS_TOKEN") ?? throw new InvalidOperationException("WHATSAPP_ACCESS_TOKEN not found.");
    }

    public async Task<Stream> DownloadMediaAsync(string mediaId)
    {
        // 1. Get media URL
        using var request1 = new HttpRequestMessage(HttpMethod.Get, $"https://graph.facebook.com/v18.0/{mediaId}");
        request1.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
        
        using var response1 = await _httpClient.SendAsync(request1);
        response1.EnsureSuccessStatusCode();
        
        var json = await response1.Content.ReadAsStringAsync();
        using var document = JsonDocument.Parse(json);
        var url = document.RootElement.GetProperty("url").GetString();
        
        if (string.IsNullOrEmpty(url))
        {
            throw new InvalidOperationException("La respuesta de Meta no contenía una URL válida para el media.");
        }

        // 2. Download media stream
        using var request2 = new HttpRequestMessage(HttpMethod.Get, url);
        request2.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _accessToken);
        
        var response2 = await _httpClient.SendAsync(request2); // We do not use "using" here because we return the stream. Wait, the response needs to be disposed? We can return the stream directly, but we should make sure we're reading it fully, or returning it as a stream. Actually, if we return `await response2.Content.ReadAsStreamAsync()`, the response won't be disposed here, which is fine, but the caller should dispose it. Or we can copy to MemoryStream.
        
        response2.EnsureSuccessStatusCode();
        
        var memoryStream = new MemoryStream();
        await response2.Content.CopyToAsync(memoryStream);
        memoryStream.Position = 0; // Rewind
        
        return memoryStream;
    }
}
