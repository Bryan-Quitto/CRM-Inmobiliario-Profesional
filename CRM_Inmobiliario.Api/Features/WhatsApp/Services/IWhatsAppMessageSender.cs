namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppMessageSender
{
    Task SendWhatsAppMessageAsync(string to, string text, string? phoneNumberId = null, bool isAiResponse = false, Guid? contactoId = null, CancellationToken cancellationToken = default);
}
