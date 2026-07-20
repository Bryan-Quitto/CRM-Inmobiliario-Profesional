using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Domain.Enums;

namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

public interface IFacebookConsentService
{
    Task<ConsentResult> HandleConsentAsync(Contacto contacto, string senderPsid, string messageText, string? pageAccessToken, string agentName, CancellationToken cancellationToken = default);
}
