namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

public interface IFacebookMessageSender
{
    Task SendTextMessageAsync(string recipientPsid, string text, string? pageAccessToken = null, bool isAiResponse = false, Guid? contactoId = null, Guid? agenteId = null, CancellationToken cancellationToken = default);
    Task SendImageMessageAsync(string recipientPsid, string imageUrl, string? pageAccessToken = null, bool isAiResponse = false, Guid? contactoId = null, Guid? agenteId = null, CancellationToken cancellationToken = default);
}
