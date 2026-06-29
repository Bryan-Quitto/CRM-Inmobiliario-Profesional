using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Tools;

public sealed class DerivarCaptacionPropietarioHandler : BaseCoreAiToolHandler
{
    private readonly CRM_Inmobiliario.Api.Features.PushNotifications.Services.IPushNotificationService _pushNotificationService;

    public DerivarCaptacionPropietarioHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<DerivarCaptacionPropietarioHandler> logger, CRM_Inmobiliario.Api.Features.PushNotifications.Services.IPushNotificationService pushNotificationService) 
        : base(dbContextFactory, logger) 
    {
        _pushNotificationService = pushNotificationService;
    }

    public override string ToolName => "DerivarCaptacionPropietario";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string nombre = ExtractSafeString(args.RootElement, "nombre", 100, "Desconocido");
        
        var identity = await ResolveIdentityAsync(context, cancellationToken);
        Guid? currentAgentId = identity?.Id;

        Contacto? existing = null;
        if (context.ContactoId.HasValue)
        {
            existing = await _context.Contactos.FindAsync(new object[] { context.ContactoId.Value }, cancellationToken);
        }

        if (existing == null && !string.IsNullOrWhiteSpace(context.ChannelIdentifier))
        {
            if (context.Channel == "Facebook")
            {
                existing = await _context.Contactos.FirstOrDefaultAsync(l => l.FacebookSenderId == context.ChannelIdentifier, cancellationToken);
            }
            else
            {
                string searchPhone = context.ChannelIdentifier.StartsWith("+") ? context.ChannelIdentifier : "+" + context.ChannelIdentifier;
                existing = await _context.Contactos.FirstOrDefaultAsync(l => l.Telefono == context.ChannelIdentifier || l.Telefono == searchPhone, cancellationToken);
            }
        }
        
        if (existing == null)
        {
            var agentIdToUse = currentAgentId ?? (await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin"))?.Id 
                               ?? (await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync())?.Id;

            if (agentIdToUse != null)
            {
                var isFacebook = context.Channel == "Facebook";
                var newPropietario = new Contacto
                {
                    Id = Guid.NewGuid(),
                    Nombre = nombre,
                    Telefono = isFacebook ? string.Empty : (context.ChannelIdentifier ?? string.Empty),
                    FacebookSenderId = isFacebook ? context.ChannelIdentifier : null,
                    Origen = isFacebook ? "IA Facebook" : "IA WhatsApp",
                    AgenteId = agentIdToUse.Value,
                    FechaCreacion = DateTimeOffset.UtcNow,
                    EstadoEmbudo = "Nuevo",
                    EsProspecto = false,
                    EsPropietario = true,
                    BotActivoWA = !isFacebook ? false : true,
                    BotActivoFB = isFacebook ? false : true,
                    TransferenciaNotificada = true,
                    EstadoIA_WA = isFacebook ? null : "Derivado a Captacion",
                    EstadoIA_FB = isFacebook ? "Derivado a Captacion" : null,
                    Notas = "Derivado automáticamente para captación de propiedad."
                };
                _context.Contactos.Add(newPropietario);
                await LogAiActionAsync("Registro Propietario Captacion", args.RootElement.GetRawText(), context);
                existing = newPropietario;
            }
        }
        else
        {
            var isFacebook = context.Channel == "Facebook";
            existing.EsPropietario = true;
            existing.EsProspecto = false;
            
            if (isFacebook)
            {
                existing.BotActivoFB = false;
                existing.EstadoIA_FB = "Derivado a Captacion";
            }
            else
            {
                existing.BotActivoWA = false;
                existing.EstadoIA_WA = "Derivado a Captacion";
            }
            
            existing.TransferenciaNotificada = true;
            existing.Notas = string.IsNullOrWhiteSpace(existing.Notas) 
                ? "Derivado automáticamente para captación de propiedad." 
                : $"{existing.Notas}\nDerivado automáticamente para captación de propiedad.";
            await LogAiActionAsync("Actualizacion a Propietario", args.RootElement.GetRawText(), context);
        }
        if (existing != null && existing.AgenteId != Guid.Empty)
        {
            var nuevaTarea = new TaskItem
            {
                Id = Guid.NewGuid(),
                AgenteId = existing.AgenteId,
                ContactoId = existing.Id,
                Titulo = "🚨 Captación de Propietario (IA)",
                Descripcion = $"La IA ha derivado a este usuario desde {context.Channel} para captación de propiedad.",
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
        
        if (existing != null && existing.AgenteId != Guid.Empty)
        {
            string displayIdentifier = (existing.Nombre == "Cliente WA" || existing.Nombre == "Cliente FB" || existing.Nombre == "Usuario Desconocido" || existing.Nombre == "Desconocido")
                ? (!string.IsNullOrWhiteSpace(existing.Telefono) ? existing.Telefono : (existing.FacebookSenderId ?? "Desconocido"))
                : existing.Nombre;

            string tipoInmueble = ExtractSafeString(args.RootElement, "tipoInmueble", 100, "inmueble");
            string ubicacion = ExtractSafeString(args.RootElement, "ubicacion", 200, "");
            string ubicacionText = string.IsNullOrWhiteSpace(ubicacion) || ubicacion.ToLower() == "ubicación no especificada" 
                ? "" 
                : $" en {ubicacion}";
            
            _logger.LogInformation($"[PUSH] Intentando notificar a AgentId {existing.AgenteId} sobre el contacto {existing.Id}");
            await _pushNotificationService.SendNotificationToAgentAsync(
                existing.AgenteId,
                "🏡 Nueva Captación de Propiedad",
                $"El cliente {displayIdentifier} está interesado en poner a la venta/alquiler su {tipoInmueble}{ubicacionText}. ¡Comunícate pronto!",
                $"/contactos/{existing.Id}",
                cancellationToken);
        }

        string nombreParaSaludo = (existing != null && (existing.Nombre == "Cliente WA" || existing.Nombre == "Cliente FB" || existing.Nombre == "Usuario Desconocido" || existing.Nombre == "Desconocido" || existing.Nombre == existing.FacebookSenderId)) 
            ? "" 
            : (existing?.Nombre ?? "");

        string saludo = string.IsNullOrWhiteSpace(nombreParaSaludo) 
            ? "Excelente," 
            : $"Excelente {nombreParaSaludo},";

        return $"INSTRUCCIÓN PARA LA IA: Dile al cliente textualmente: '{saludo} un agente especializado en captación de propiedades se comunicará contigo en breve para atenderte de manera personalizada con tu propiedad. ¡Gracias por confiar en nosotros!'";
    }
}











