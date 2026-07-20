using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Domain.Enums;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

public sealed class FacebookConsentService : IFacebookConsentService
{
    private readonly IFacebookMessageSender _messageSender;
    private readonly CrmDbContext _dbContext;
    private readonly ILogger<FacebookConsentService> _logger;

    public FacebookConsentService(IFacebookMessageSender messageSender, CrmDbContext dbContext, ILogger<FacebookConsentService> logger)
    {
        _messageSender = messageSender;
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task<ConsentResult> HandleConsentAsync(Contacto contacto, string senderPsid, string messageText, string? pageAccessToken, string agentName, CancellationToken cancellationToken = default)
    {
        if (contacto.ConsentimientoIA_FB == nameof(ConsentResult.Granted))
        {
            return ConsentResult.Granted;
        }

        if (contacto.ConsentimientoIA_FB == nameof(ConsentResult.Denied) || contacto.ConsentimientoIA_FB == nameof(ConsentResult.DeniedResponse))
        {
            return ConsentResult.Denied;
        }

        if (contacto.ConsentimientoIA_FB == nameof(ConsentResult.PendingConsent) || contacto.ConsentimientoIA_FB == null)
        {
            bool hasMessages = await _dbContext.FacebookMessages.AnyAsync(m => m.ContactoId == contacto.Id, cancellationToken);
            
            if (!hasMessages)
            {
                string requestText = $"¡Hola! Soy el asistente virtual de {agentName}.\n\n" +
                                     $"Antes de continuar, necesito tu consentimiento para:\n\n" +
                                     $"✅ Registrar esta conversación en nuestro sistema\n" +
                                     $"✅ Procesar tus mensajes con Inteligencia Artificial\n\n" +
                                     $"¿Aceptas continuar?\n" +
                                     $"1. Responde SI para aceptar\n" +
                                     $"2. Responde NO si prefieres no continuar\n\n" +
                                     $"Tu privacidad es importante para nosotros.";
                await _messageSender.SendTextMessageAsync(senderPsid, requestText, pageAccessToken, isAiResponse: true, contacto.Id, contacto.AgenteId, cancellationToken);
                return ConsentResult.RequestSent;
            }

            var msgUpper = messageText.Trim().ToUpperInvariant();

            if (IsGranted(msgUpper))
            {
                contacto.ConsentimientoIA_FB = nameof(ConsentResult.Granted);
                await _dbContext.SaveChangesAsync(cancellationToken);
                
                string text = "¡Gracias! Tu consentimiento ha sido registrado. ¿En qué te puedo ayudar hoy?";
                await _messageSender.SendTextMessageAsync(senderPsid, text, pageAccessToken, isAiResponse: true, contacto.Id, contacto.AgenteId, cancellationToken);
                
                return ConsentResult.JustGranted; 
            }
            
            if (IsDenied(msgUpper))
            {
                contacto.ConsentimientoIA_FB = nameof(ConsentResult.Denied);
                contacto.BotActivoFB = false;
                await _dbContext.SaveChangesAsync(cancellationToken);
                
                string text = "Entendido. No registraremos tus mensajes ni utilizaremos Inteligencia Artificial. Un agente humano se comunicará contigo pronto. ¡Gracias!";
                await _messageSender.SendTextMessageAsync(senderPsid, text, pageAccessToken, isAiResponse: true, contacto.Id, contacto.AgenteId, cancellationToken);
                
                return ConsentResult.DeniedResponse;
            }

            string apologyText = $"Disculpa, para poder ayudarte necesito que confirmes tu consentimiento.\n\n" +
                                 $"¿Aceptas que registremos esta conversación y usemos IA?\n" +
                                 $"1. Responde SI para aceptar\n" +
                                 $"2. Responde NO si prefieres no continuar";
            await _messageSender.SendTextMessageAsync(senderPsid, apologyText, pageAccessToken, isAiResponse: true, contacto.Id, contacto.AgenteId, cancellationToken);
            
            return ConsentResult.StillPending;
        }

        return ConsentResult.Granted;
    }

    private bool IsGranted(string msg)
    {
        return msg == "SI" || msg == "SÍ" || msg == "1" || msg == "ACEPTO" || msg == "OK" || 
               msg.StartsWith("SI ") || msg.StartsWith("SÍ ") || msg.StartsWith("ACEPTO ");
    }

    private bool IsDenied(string msg)
    {
        return msg == "NO" || msg == "2" || msg == "RECHAZO" ||
               msg.StartsWith("NO ") || msg.StartsWith("RECHAZO ");
    }
}
