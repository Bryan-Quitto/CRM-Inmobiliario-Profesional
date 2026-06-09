using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

/// <summary>
/// Encapsula la llamada a la Graph API para obtener el nombre real de un usuario
/// a partir de su PSID (Page-Scoped User ID).
/// Extraído de FacebookContextBuilder para respetar el límite de 200 líneas por archivo.
/// </summary>
internal sealed class FacebookProfileFetcher
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger _logger;

    public FacebookProfileFetcher(IHttpClientFactory httpClientFactory, ILogger logger)
    {
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public record FacebookUserProfile(string? FirstName, string? LastName, string? FullName);

    public async Task<FacebookUserProfile> FetchAsync(string psid, string pageAccessToken)
    {
        try
        {
            var client = _httpClientFactory.CreateClient();
            var url = $"https://graph.facebook.com/v21.0/{psid}?fields=first_name,last_name,name&access_token={pageAccessToken}";
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                // Meta puede retornar 400 para cuentas de solo teléfono (error 2018218) u otros permisos faltantes
                _logger.LogWarning("Graph API retornó {Status} al obtener perfil de PSID {Psid}.", response.StatusCode, psid);
                return new FacebookUserProfile(null, null, null);
            }

            using var stream = await response.Content.ReadAsStreamAsync();
            using var doc = await System.Text.Json.JsonDocument.ParseAsync(stream);
            var root = doc.RootElement;

            var firstName = root.TryGetProperty("first_name", out var fn) ? fn.GetString() : null;
            var lastName  = root.TryGetProperty("last_name",  out var ln) ? ln.GetString() : null;
            var fullName  = root.TryGetProperty("name",       out var nm) ? nm.GetString() : null;

            return new FacebookUserProfile(firstName, lastName, fullName);
        }
        catch (Exception ex)
        {
            // No propagar — un fallo en el enriquecimiento no debe bloquear la conversación
            _logger.LogWarning(ex, "Error al obtener perfil de Facebook para PSID {Psid}.", psid);
            return new FacebookUserProfile(null, null, null);
        }
    }
}
