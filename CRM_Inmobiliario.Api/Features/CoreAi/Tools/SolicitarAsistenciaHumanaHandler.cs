using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Tools;

public sealed class SolicitarAsistenciaHumanaHandler : BaseCoreAiToolHandler
{
    private readonly CRM_Inmobiliario.Api.Features.PushNotifications.Services.IPushNotificationService _pushNotificationService;

    public SolicitarAsistenciaHumanaHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<SolicitarAsistenciaHumanaHandler> logger, CRM_Inmobiliario.Api.Features.PushNotifications.Services.IPushNotificationService pushNotificationService) 
        : base(dbContextFactory, logger) 
    {
        _pushNotificationService = pushNotificationService;
    }

    public override string ToolName => "SolicitarAsistenciaHumana";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string motivo = ExtractSafeString(args.RootElement, "motivo", 500, "No especificado");
        await LogAiActionAsync("Alerta", args.RootElement.GetRawText(), context, cancellationToken);
        
        var identity = await ResolveIdentityAsync(context, cancellationToken);
        Guid? currentAgentId = identity?.Id;

        Contacto? contacto = null;
        if (context.ContactoId.HasValue)
        {
            contacto = await _context.Contactos.FindAsync(new object[] { context.ContactoId.Value }, cancellationToken);
        }

        if (contacto == null)
        {
            var agentIdToUse = currentAgentId ?? (await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin", cancellationToken))?.Id
                               ?? (await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync(cancellationToken))?.Id;

            var isFacebook = context.Channel == "Facebook";
            contacto = new Contacto
            {
                Id = Guid.NewGuid(),
                Nombre = isFacebook ? "Cliente FB" : "Usuario Desconocido",
                Telefono = isFacebook ? string.Empty : (context.ChannelIdentifier ?? string.Empty),
                FacebookSenderId = isFacebook ? context.ChannelIdentifier : null,
                Origen = isFacebook ? "IA Facebook" : "IA WhatsApp",
                AgenteId = agentIdToUse ?? Guid.Empty,
                FechaCreacion = DateTimeOffset.UtcNow,
                EtapaEmbudo = "Nuevo",
                EstadoIA_WA = isFacebook ? null : "Escalado",
                EstadoIA_FB = isFacebook ? "Escalado" : null,
                EsProspecto = true,
                Notas = $"Escalamiento: {motivo}",
                BotActivoWA = !isFacebook ? false : true,
                BotActivoFB = isFacebook ? false : true,
                TransferenciaNotificada = true
            };
            _context.Contactos.Add(contacto);
        }
        else
        {
            var isFacebook = context.Channel == "Facebook";
            if (isFacebook)
            {
                contacto.EstadoIA_FB = "Escalado";
                contacto.BotActivoFB = false;
            }
            else
            {
                contacto.EstadoIA_WA = "Escalado";
                contacto.BotActivoWA = false;
            }
            
            contacto.Notas = string.IsNullOrWhiteSpace(contacto.Notas) 
                ? $"Escalamiento: {motivo}" 
                : $"{contacto.Notas}\nEscalamiento: {motivo}";
            
            contacto.TransferenciaNotificada = true;
            
            _context.Contactos.Update(contacto);
        }
        
        await _context.SaveChangesAsync(cancellationToken);

        if (contacto.AgenteId != Guid.Empty)
        {
            string displayIdentifier = (contacto.Nombre == "Cliente WA" || contacto.Nombre == "Cliente FB" || contacto.Nombre == "Usuario Desconocido" || contacto.Nombre == "Desconocido")
                ? (!string.IsNullOrWhiteSpace(contacto.Telefono) ? contacto.Telefono : (contacto.FacebookSenderId ?? "Desconocido"))
                : contacto.Nombre;

            _logger.LogInformation($"[PUSH] Intentando notificar a AgentId {contacto.AgenteId} sobre el contacto {contacto.Id}");
            await _pushNotificationService.SendNotificationToAgentAsync(
                contacto.AgenteId,
                "🚨 Asistencia Humana Solicitada",
                $"El cliente {displayIdentifier} requiere intervención inmediata. Motivo: {motivo}",
                $"/contactos/{contacto.Id}",
                cancellationToken);
        }
        else
        {
            _logger.LogWarning($"[PUSH] No se pudo notificar porque contacto.AgenteId está vacío para contacto {contacto.Id}");
        }

        return "Solicitud de asistencia enviada al equipo humano.";
    }
}
