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
            string searchPhone = context.ChannelIdentifier.StartsWith("+") ? context.ChannelIdentifier : "+" + context.ChannelIdentifier;
            existing = await _context.Contactos.FirstOrDefaultAsync(l => l.Telefono == context.ChannelIdentifier || l.Telefono == searchPhone, cancellationToken);
        }
        
        if (existing == null)
        {
            var agentIdToUse = currentAgentId ?? (await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin"))?.Id 
                               ?? (await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync())?.Id;

            if (agentIdToUse != null)
            {
                var newPropietario = new Contacto
                {
                    Id = Guid.NewGuid(),
                    Nombre = nombre,
                    Telefono = context.ChannelIdentifier ?? string.Empty,
                    Origen = "IA WhatsApp",
                    AgenteId = agentIdToUse.Value,
                    FechaCreacion = DateTimeOffset.UtcNow,
                    EtapaEmbudo = "Nuevo",
                    EsProspecto = false,
                    EsPropietario = true,
                    BotActivoWA = false,
                    TransferenciaNotificada = true,
                    EstadoIA_WA = "Derivado a Captacion",
                    Notas = "Derivado automáticamente para captación de propiedad."
                };
                _context.Contactos.Add(newPropietario);
                await LogAiActionAsync("Registro Propietario Captacion", args.RootElement.GetRawText(), context);
                existing = newPropietario;
            }
        }
        else
        {
            existing.EsPropietario = true;
            existing.EsProspecto = false;
            existing.BotActivoWA = false;
            existing.TransferenciaNotificada = true;
            existing.EstadoIA_WA = "Derivado a Captacion";
            existing.Notas = string.IsNullOrWhiteSpace(existing.Notas) 
                ? "Derivado automáticamente para captación de propiedad." 
                : $"{existing.Notas}\nDerivado automáticamente para captación de propiedad.";
            await LogAiActionAsync("Actualizacion a Propietario", args.RootElement.GetRawText(), context);
        }
        
        await _context.SaveChangesAsync(cancellationToken);
        
        if (existing != null && existing.AgenteId != Guid.Empty)
        {
            string displayIdentifier = (existing.Nombre == "Cliente WA" || existing.Nombre == "Usuario Desconocido" || existing.Nombre == "Desconocido")
                ? (!string.IsNullOrWhiteSpace(existing.Telefono) ? existing.Telefono : "Desconocido")
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

        string nombreParaSaludo = (existing != null && (existing.Nombre == "Cliente WA" || existing.Nombre == "Usuario Desconocido" || existing.Nombre == "Desconocido" || existing.Nombre == existing.FacebookSenderId)) 
            ? "" 
            : (existing?.Nombre ?? "");

        string saludo = string.IsNullOrWhiteSpace(nombreParaSaludo) 
            ? "Excelente," 
            : $"Excelente {nombreParaSaludo},";

        return $"INSTRUCCIÓN PARA LA IA: Dile al cliente textualmente: '{saludo} un agente especializado en captación de propiedades se comunicará contigo en breve para asesorarte de manera personalizada con tu inmueble. ¡Gracias por confiar en nosotros!'";
    }
}











