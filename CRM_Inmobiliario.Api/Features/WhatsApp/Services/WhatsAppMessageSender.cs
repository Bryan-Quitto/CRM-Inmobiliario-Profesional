using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public sealed class WhatsAppMessageSender : IWhatsAppMessageSender
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WhatsAppMessageSender> _logger;
    private readonly string? _whatsappToken;
    private readonly string? _whatsappPhoneId;

    public WhatsAppMessageSender(HttpClient httpClient, ILogger<WhatsAppMessageSender> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _whatsappToken = Environment.GetEnvironmentVariable("WHATSAPP_ACCESS_TOKEN")?.Trim().Trim('"');
        _whatsappPhoneId = Environment.GetEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID")?.Trim().Trim('"');
    }

    public async Task SendWhatsAppMessageAsync(string to, string text)
    {
        if (string.IsNullOrEmpty(_whatsappToken) || string.IsNullOrEmpty(_whatsappPhoneId))
        {
            _logger.LogWarning("WhatsApp Message Sender: Credenciales no configuradas.");
            return;
        }

        var url = $"https://graph.facebook.com/v19.0/{_whatsappPhoneId}/messages";
        var payload = new
        {
            messaging_product = "whatsapp",
            to = to,
            type = "text",
            text = new { body = text }
        };

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _whatsappToken);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error enviando mensaje de WhatsApp a {Phone}: {Error}", to, error);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando mensaje de WhatsApp a {Phone}", to);
        }
    }
}
