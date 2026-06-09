namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

public interface IFacebookMessageSender
{
    Task SendTextMessageAsync(string recipientPsid, string text, string pageAccessToken, CancellationToken cancellationToken = default);
}
