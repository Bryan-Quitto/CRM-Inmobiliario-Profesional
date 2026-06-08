using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class DerivarCaptacionPropietarioHandler : BaseCoreAiToolHandler
{
    public DerivarCaptacionPropietarioHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<DerivarCaptacionPropietarioHandler> logger) 
        : base(dbContextFactory, logger) { }

    public override string ToolName => "DerivarCaptacionPropietario";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string nombre = ExtractSafeString(args.RootElement, "nombre", 100, "Desconocido");
        
        var identity = await ResolveIdentityAsync(context, cancellationToken);
        Guid? currentAgentId = identity?.Id;

        string searchPhone = context.CustomerPhone?.StartsWith("+") == true ? context.CustomerPhone : "+" + (context.CustomerPhone ?? "");
        var existing = await _context.Contactos.FirstOrDefaultAsync(l => l.Telefono == context.CustomerPhone || l.Telefono == searchPhone);
        
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
                    Telefono = context.CustomerPhone ?? string.Empty,
                    Origen = "IA WhatsApp",
                    AgenteId = agentIdToUse.Value,
                    FechaCreacion = DateTimeOffset.UtcNow,
                    EtapaEmbudo = "Nuevo",
                    EsProspecto = false,
                    EsPropietario = true,
                    BotActivo = false,
                    TransferenciaNotificada = true,
                    EstadoIA = "Derivado a Captacion",
                    Notas = "Derivado automáticamente para captación de propiedad."
                };
                _context.Contactos.Add(newPropietario);
                await LogAiActionAsync("Registro Propietario Captacion", args.RootElement.GetRawText(), context);
            }
        }
        else
        {
            existing.EsPropietario = true;
            existing.EsProspecto = false;
            existing.BotActivo = false;
            existing.TransferenciaNotificada = true;
            existing.EstadoIA = "Derivado a Captacion";
            existing.Notas = string.IsNullOrWhiteSpace(existing.Notas) 
                ? "Derivado automáticamente para captación de propiedad." 
                : $"{existing.Notas}\nDerivado automáticamente para captación de propiedad.";
            await LogAiActionAsync("Actualizacion a Propietario", args.RootElement.GetRawText(), context);
        }
        
        await _context.SaveChangesAsync(cancellationToken);
        
        return "INSTRUCCIÓN PARA LA IA: Dile al cliente textualmente: 'Excelente [Nombre], un agente especializado en captación de propiedades se comunicará contigo en breve para asesorarte de manera personalizada con tu inmueble. ¡Gracias por confiar en nosotros!'";
    }
}











