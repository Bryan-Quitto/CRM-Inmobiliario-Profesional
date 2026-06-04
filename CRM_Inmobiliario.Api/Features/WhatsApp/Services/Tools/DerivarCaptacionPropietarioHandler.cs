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
        
        string searchPhone = context.CustomerPhone?.StartsWith("+") == true ? context.CustomerPhone : "+" + (context.CustomerPhone ?? "");
        var existing = await _context.Contactos.FirstOrDefaultAsync(l => l.Telefono == context.CustomerPhone || l.Telefono == searchPhone);
        
        if (existing == null)
        {
            var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin")
                        ?? await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync();

            if (agent != null)
            {
                var newPropietario = new Contacto
                {
                    Id = Guid.NewGuid(),
                    Nombre = nombre,
                    Telefono = context.CustomerPhone ?? string.Empty,
                    Origen = "IA WhatsApp",
                    AgenteId = agent.Id,
                    FechaCreacion = DateTimeOffset.UtcNow,
                    EtapaEmbudo = "Nuevo",
                    EsProspecto = false,
                    EsPropietario = true
                };
                _context.Contactos.Add(newPropietario);
                await LogAiActionAsync("Registro Propietario Captacion", args.RootElement.GetRawText(), context);
            }
        }
        else
        {
            if (!existing.EsPropietario)
            {
                existing.EsPropietario = true;
                existing.EsProspecto = false;
                await LogAiActionAsync("Actualizacion a Propietario", args.RootElement.GetRawText(), context);
            }
        }
        
        return "INSTRUCCIÓN PARA LA IA: Dile al cliente textualmente: 'Excelente [Nombre], un agente especializado en captación de propiedades se comunicará contigo en breve para asesorarte de manera personalizada con tu inmueble. ¡Gracias por confiar en nosotros!'";
    }
}











