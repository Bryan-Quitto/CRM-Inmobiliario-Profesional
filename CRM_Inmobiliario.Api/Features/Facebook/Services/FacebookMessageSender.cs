using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

public sealed class FacebookMessageSender : IFacebookMessageSender
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FacebookMessageSender> _logger;

    public FacebookMessageSender(HttpClient httpClient, ILogger<FacebookMessageSender> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task SendTextMessageAsync(string recipientPsid, string text, string pageAccessToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(pageAccessToken))
        {
            _logger.LogWarning("FacebookMessageSender: pageAccessToken vacío. No se puede enviar mensaje a PSID {Psid}.", recipientPsid);
            return;
        }

        // El access_token va como query param, no como header — requerimiento de la API de Messenger
        var url = $"https://graph.facebook.com/v21.0/me/messages?access_token={pageAccessToken}";
        var payload = new
        {
            recipient = new { id = recipientPsid },
            message = new { text = text }
        };

        try
        {
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Error enviando mensaje de Facebook a PSID {Psid}: {Error}", recipientPsid, error);
                response.EnsureSuccessStatusCode();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando mensaje de Facebook a PSID {Psid}", recipientPsid);
            throw;
        }
    }
}
