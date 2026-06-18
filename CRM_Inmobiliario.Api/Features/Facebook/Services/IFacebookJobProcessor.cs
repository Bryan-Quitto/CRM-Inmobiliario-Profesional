namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

public interface IFacebookJobProcessor
{
    Task ProcessMessageAsync(string senderId, string text, string pageId, string? codigoCorto = null, CancellationToken cancellationToken = default);
}
