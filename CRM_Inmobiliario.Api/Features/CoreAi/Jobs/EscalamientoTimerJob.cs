using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.Facebook.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Hangfire;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Jobs;

/// <summary>
/// Se ejecuta 5 minutos después del escalamiento si el agente aún no ha respondido al cliente.
/// Un solo intento para evitar mensajes duplicados en caso de fallo transitorio.
/// </summary>
[AutomaticRetry(Attempts = 1)]
public class EscalamientoTimerJob
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<EscalamientoTimerJob> _logger;

    public EscalamientoTimerJob(IServiceScopeFactory scopeFactory, ILogger<EscalamientoTimerJob> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task EjecutarAsync(Guid contactoId, Guid tareaId, string nombreAgente, string canal)
    {
        await using var scope = _scopeFactory.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<CrmDbContext>();

        // Guard: el agente ya respondió manualmente — el auto-complete limpió el jobId
        var contacto = await context.Contactos
            .Where(c => c.Id == contactoId)
            .Select(c => new
            {
                c.Id,
                c.PendingEscalamientoJobId,
                c.Telefono,
                c.FacebookSenderId,
                c.AgenteId
            })
            .FirstOrDefaultAsync();

        if (contacto?.PendingEscalamientoJobId is null)
        {

            return;
        }

        // Guard: la tarea ya fue cerrada manualmente desde el CRM
        var tarea = await context.Tasks.FindAsync(tareaId);
        if (tarea is null || tarea.Estado != "Pendiente")
        {

            await LimpiarEscalacionAsync(context, contactoId);
            return;
        }

        var mensaje = $"En unos momentos el agente {nombreAgente} le ayudará con esa información.";

        try
        {
            if (canal == "WhatsApp")
            {
                var agente = await context.Agents
                    .Where(a => a.Id == contacto.AgenteId)
                    .Select(a => new { a.WhatsAppPhoneNumberId })
                    .FirstOrDefaultAsync();

                var sender = scope.ServiceProvider.GetRequiredService<IWhatsAppMessageSender>();
                await sender.SendWhatsAppMessageAsync(
                    contacto.Telefono ?? string.Empty,
                    mensaje,
                    agente?.WhatsAppPhoneNumberId,
                    isAiResponse: false,
                    contactoId: contactoId);
            }
            else
            {
                var agente = await context.Agents
                    .Where(a => a.Id == contacto.AgenteId)
                    .Select(a => new { a.FacebookPageAccessToken })
                    .FirstOrDefaultAsync();

                var sender = scope.ServiceProvider.GetRequiredService<IFacebookMessageSender>();
                await sender.SendTextMessageAsync(
                    contacto.FacebookSenderId!,
                    mensaje,
                    agente?.FacebookPageAccessToken,
                    isAiResponse: false,
                    contactoId: contactoId,
                    agenteId: contacto.AgenteId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EscalamientoTimerJob: error enviando mensaje al cliente {Id} por {Canal}.", contactoId, canal);
            throw;
        }

        await LimpiarEscalacionAsync(context, contactoId);
    }

    private static async Task LimpiarEscalacionAsync(CrmDbContext context, Guid contactoId)
    {
        await context.Contactos
            .Where(c => c.Id == contactoId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.PendingEscalamientoJobId, (string?)null)
                .SetProperty(c => c.PendingEscalamientoTareaId, (Guid?)null));
    }
}
