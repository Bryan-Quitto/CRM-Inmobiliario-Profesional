using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Domain.Enums;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppConsentService
{
    Task<ConsentResult> HandleConsentAsync(Contacto contacto, string phone, string messageText, string? phoneNumberId, string agentName, CancellationToken cancellationToken = default);
}
