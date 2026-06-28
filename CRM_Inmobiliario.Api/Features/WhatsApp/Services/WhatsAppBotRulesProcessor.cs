using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppBotRulesProcessor
{
    Task<string?> ApplyHandoffRulesAsync(Contacto? contacto, CancellationToken cancellationToken = default);
}

public sealed class WhatsAppBotRulesProcessor : IWhatsAppBotRulesProcessor
{
    private readonly CrmDbContext _context;
    private readonly ILogger<WhatsAppBotRulesProcessor> _logger;

    public WhatsAppBotRulesProcessor(CrmDbContext context, ILogger<WhatsAppBotRulesProcessor> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<string?> ApplyHandoffRulesAsync(Contacto? contacto, CancellationToken cancellationToken = default)
    {
        string? autoMsg = null;
        if (contacto != null)
        {
            // CHECK RATE LIMIT IA
            var now = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
            var targetDate = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.FromHours(-5));
            var usage = await _context.ContactDailyTokenUsages
                .FirstOrDefaultAsync(u => u.ContactoId == contacto.Id && u.Date == targetDate && u.Channel == "WhatsApp", cancellationToken);
                
            int limit = contacto.Agente?.DailyTokenLimitPerContact ?? 50000;
            
            if (usage != null && (usage.InputTokens + usage.OutputTokens) >= limit)
            {
                if (contacto.BotActivoWA)
                {
                    contacto.BotActivoWA = false;
                    contacto.EstadoIA_WA = "LimiteAlcanzado";
                    contacto.TransferenciaNotificada = false;
                    await _context.SaveChangesAsync(cancellationToken);
                    
                    _logger.LogInformation("Límite IA Alcanzado para contacto {Id}. Bot desactivado.", contacto.Id);
                }
            }
            else
            {
                if (!contacto.BotActivoWA && contacto.EstadoIA_WA == "LimiteAlcanzado")
                {
                    contacto.BotActivoWA = true;
                    contacto.EstadoIA_WA = null;
                    contacto.TransferenciaNotificada = false;
                    await _context.SaveChangesAsync(cancellationToken);
                    
                    _logger.LogInformation("Límite diario reseteado para contacto {Id}. Bot reactivado.", contacto.Id);
                }
            }

            // Regla: Si es solo propietario (no prospecto), requiere asistencia humana inmediata
            if (contacto.EsPropietario && !contacto.EsProspecto && contacto.BotActivoWA)
            {
                contacto.BotActivoWA = false;
                contacto.EstadoIA_WA = "Escalado";
                await _context.Contactos
                    .Where(c => c.Id == contacto.Id)
                    .ExecuteUpdateAsync(s => s
                        .SetProperty(c => c.BotActivoWA, false)
                        .SetProperty(c => c.EstadoIA_WA, "Escalado")
                        .SetProperty(c => c.TransferenciaNotificada, false), cancellationToken);
            }

            if (!contacto.BotActivoWA)
            {
                if (!contacto.TransferenciaNotificada)
                {
                    if (contacto.EstadoIA_WA == "LimiteAlcanzado")
                    {
                        autoMsg = "Lamentablemente has alcanzado el límite de consultas automáticas por el día de hoy. 🤖 ¡Pero no te preocupes! En unos instantes un agente humano continuará ayudándote con tus dudas.";
                    }
                    else
                    {
                        autoMsg = "En este momento se está transfiriendo a uno de nuestros agentes humanos para que le atienda personalmente.";
                    }
                    
                    await _context.Contactos
                        .Where(c => c.Id == contacto.Id)
                        .ExecuteUpdateAsync(s => s.SetProperty(c => c.TransferenciaNotificada, true), cancellationToken);
                }
                else
                {
                    autoMsg = string.Empty; // Silence Mode
                }
            }
        }
        return autoMsg;
    }
}
