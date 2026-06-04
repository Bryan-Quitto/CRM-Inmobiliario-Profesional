using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class RegistrarInteresContactoHandler : BaseCoreAiToolHandler
{
    public RegistrarInteresContactoHandler(CrmDbContext context, ILogger<RegistrarInteresContactoHandler> logger) 
        : base(context, logger) { }

    public override string ToolName => "RegistrarInteresContacto";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context)
    {
        if (!args.RootElement.TryGetProperty("propiedadId", out var pIdProp) || !Guid.TryParse(pIdProp.GetString(), out var propiedadId))
            return "Error: ID de propiedad inválido.";

        bool propertyExists = await _context.Properties.AnyAsync(p => p.Id == propiedadId);
        if (!propertyExists)
            return "Error: La propiedad con ese ID no existe en la base de datos. Por favor verifica el ID o pide disculpas al usuario por la confusión.";

        string nivel = args.RootElement.GetProperty("nivelInteres").GetString() ?? "Medio";
        
        if (nivel == "Descartada")
        {
            var conversation = await _context.WhatsappConversations.FirstOrDefaultAsync(c => c.Telefono == context.CustomerPhone);
            if (conversation != null)
            {
                var history = conversation.HistorialJson.ToLower();
                if ((history.Contains("presupuesto") || history.Contains("$") || history.Contains("precio") || history.Contains("barat")) 
                    && !history.Contains("no me gusta") && !history.Contains("feo") && !history.Contains("descart") && !history.Contains("quitar"))
                {
                    _logger.LogWarning("Previendo descarte automático por presupuesto para {context.CustomerPhone}. Cambiando a 'Bajo'.", context.CustomerPhone);
                    nivel = "Bajo";
                }
            }
        }

        if (context.Contacto == null) return "Error: El context.Contacto debe estar registrado antes de marcar interés.";

        var interest = await _context.ContactoInteresPropiedades
            .FirstOrDefaultAsync(i => i.ContactoId == context.Contacto.Id && i.PropiedadId == propiedadId);

        if (interest == null)
        {
            interest = new ContactoInteresPropiedad
            {
                ContactoId = context.Contacto.Id,
                PropiedadId = propiedadId,
                NivelInteres = nivel,
                FechaRegistro = DateTimeOffset.UtcNow
            };
            _context.ContactoInteresPropiedades.Add(interest);
        }
        else
        {
            interest.NivelInteres = nivel;
            interest.FechaRegistro = DateTimeOffset.UtcNow;
        }

        await LogAiActionAsync("RegistroInteres", args.RootElement.GetRawText(), context);
        
        return $"Interés registrado correctamente como '{nivel}'.";
    }
}





