using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class DerivarCaptacionPropietarioHandler : BaseWhatsAppToolHandler
{
    public DerivarCaptacionPropietarioHandler(CrmDbContext context, ILogger<DerivarCaptacionPropietarioHandler> logger) 
        : base(context, logger) { }

    public override string ToolName => "DerivarCaptacionPropietario";

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Contacto? contacto)
    {
        string nombre = args.RootElement.GetProperty("nombre").GetString() ?? "Desconocido";
        
        string searchPhone = phone.StartsWith("+") ? phone : "+" + phone;
        var existing = await _context.Contactos.FirstOrDefaultAsync(l => l.Telefono == phone || l.Telefono == searchPhone);
        
        if (existing == null)
        {
            var adminId = Guid.Parse("d4a6efdd-b801-40fb-901e-64e36f6b1400");
            var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Id == adminId)
                        ?? await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync();

            if (agent != null)
            {
                var newPropietario = new Contacto
                {
                    Id = Guid.NewGuid(),
                    Nombre = nombre,
                    Telefono = phone,
                    Origen = "IA WhatsApp",
                    AgenteId = agent.Id,
                    FechaCreacion = DateTimeOffset.UtcNow,
                    EtapaEmbudo = "Nuevo",
                    EsProspecto = false,
                    EsPropietario = true
                };
                _context.Contactos.Add(newPropietario);
                await LogAiActionAsync("Registro Propietario Captacion", args.RootElement.GetRawText(), phone, triggerMessage, newPropietario.Id);
            }
        }
        else
        {
            if (!existing.EsPropietario)
            {
                existing.EsPropietario = true;
                existing.EsProspecto = false;
                await LogAiActionAsync("Actualizacion a Propietario", args.RootElement.GetRawText(), phone, triggerMessage, existing.Id);
            }
        }
        
        return "INSTRUCCIÓN PARA LA IA: Dile al cliente textualmente: 'Excelente [Nombre], un agente especializado en captación de propiedades se comunicará contigo en breve para asesorarte de manera personalizada con tu inmueble. ¡Gracias por confiar en nosotros!'";
    }
}
