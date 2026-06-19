using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Hangfire;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Tools;

public sealed class SolicitarAsistenciaHumanaHandler : BaseCoreAiToolHandler
{
    private readonly CRM_Inmobiliario.Api.Features.PushNotifications.Services.IPushNotificationService _pushNotificationService;

    private readonly IBackgroundJobClient _backgroundJobClient;

    public SolicitarAsistenciaHumanaHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<SolicitarAsistenciaHumanaHandler> logger, CRM_Inmobiliario.Api.Features.PushNotifications.Services.IPushNotificationService pushNotificationService, IBackgroundJobClient backgroundJobClient) 
        : base(dbContextFactory, logger) 
    {
        _pushNotificationService = pushNotificationService;
        _backgroundJobClient = backgroundJobClient;
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

        TaskItem? nuevaTarea = null;
        if (contacto.AgenteId != Guid.Empty)
        {
            nuevaTarea = new TaskItem
            {
                Id = Guid.NewGuid(),
                AgenteId = contacto.AgenteId,
                ContactoId = contacto.Id,
                Titulo = "🚨 Intervención Inmediata IA",
                Descripcion = $"La IA ha escalado este chat desde {context.Channel}. Motivo: {motivo}",
                TipoTarea = "Asistencia Urgente",
                ColorHex = "#EF4444",
                Estado = "Pendiente",
                DuracionMinutos = 15,
                FechaCreacion = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)),
                FechaInicio = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).AddMinutes(1)
            };
            _context.Tasks.Add(nuevaTarea);
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

            // Programar timer diferido: si el agente no responde en 5 min, el job notifica al cliente
            if (nuevaTarea != null)
            {
                var canal = context.Channel == "Facebook" ? "Facebook" : "WhatsApp";
                var agente = await _context.Agents
                    .Where(a => a.Id == contacto.AgenteId)
                    .Select(a => new { a.Nombre })
                    .FirstOrDefaultAsync(cancellationToken);

                var jobId = _backgroundJobClient.Schedule<CRM_Inmobiliario.Api.Features.CoreAi.Jobs.EscalamientoTimerJob>(
                    job => job.EjecutarAsync(contacto.Id, nuevaTarea.Id, agente!.Nombre, canal),
                    TimeSpan.FromMinutes(5));

                contacto.PendingEscalamientoJobId = jobId;
                contacto.PendingEscalamientoTareaId = nuevaTarea.Id;
                await _context.SaveChangesAsync(cancellationToken);
            }
        }
        else
        {
            _logger.LogWarning($"[PUSH] No se pudo notificar porque contacto.AgenteId está vacío para contacto {contacto.Id}");
        }

        // Escalación silenciosa: el LLM NO debe generar respuesta al cliente.
        // El job EscalamientoTimerJob enviará el mensaje al cliente después de 5 minutos
        // si el agente no ha respondido antes.
        return "[SISTEMA: Asistencia solicitada. NO respondas al cliente. El agente será notificado.]";
    }
}
