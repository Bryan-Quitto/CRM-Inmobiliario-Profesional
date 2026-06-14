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

            contacto = new Contacto
            {
                Id = Guid.NewGuid(),
                Nombre = "Usuario Desconocido",
                Telefono = context.ChannelIdentifier ?? string.Empty,
                Origen = "IA WhatsApp",
                AgenteId = agentIdToUse ?? Guid.Empty,
                FechaCreacion = DateTimeOffset.UtcNow,
                EtapaEmbudo = "Nuevo",
                EstadoIA_WA = "Escalado",
                EsProspecto = true,
                Notas = $"Escalamiento: {motivo}",
                BotActivoWA = false,
                TransferenciaNotificada = true
            };
            _context.Contactos.Add(contacto);
        }
        else
        {
            contacto.EstadoIA_WA = "Escalado";
            contacto.Notas = string.IsNullOrWhiteSpace(contacto.Notas) 
                ? $"Escalamiento: {motivo}" 
                : $"{contacto.Notas}\nEscalamiento: {motivo}";
            
            contacto.BotActivoWA = false;
            contacto.TransferenciaNotificada = true;
            
            _context.Contactos.Update(contacto);
        }
        
        await _context.SaveChangesAsync(cancellationToken);

        if (contacto.AgenteId != Guid.Empty)
        {
            string displayIdentifier = (contacto.Nombre == "Cliente WA" || contacto.Nombre == "Usuario Desconocido" || contacto.Nombre == "Desconocido")
                ? (!string.IsNullOrWhiteSpace(contacto.Telefono) ? contacto.Telefono : "Desconocido")
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
