using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class RegistrarInteresProspectoHandler : BaseWhatsAppToolHandler
{
    public RegistrarInteresProspectoHandler(CrmDbContext context, ILogger<RegistrarInteresProspectoHandler> logger) 
        : base(context, logger) { }

    public override string ToolName => "RegistrarInteresProspecto";

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Contacto? contacto)
    {
        if (!args.RootElement.TryGetProperty("propiedadId", out var pIdProp) || !Guid.TryParse(pIdProp.GetString(), out var propiedadId))
            return "Error: ID de propiedad inválido.";

        string nivel = args.RootElement.GetProperty("nivelInteres").GetString() ?? "Medio";
        
        if (nivel == "Descartada")
        {
            var conversation = await _context.WhatsappConversations.FirstOrDefaultAsync(c => c.Telefono == phone);
            if (conversation != null)
            {
                var history = conversation.HistorialJson.ToLower();
                if ((history.Contains("presupuesto") || history.Contains("$") || history.Contains("precio") || history.Contains("barat")) 
                    && !history.Contains("no me gusta") && !history.Contains("feo") && !history.Contains("descart") && !history.Contains("quitar"))
                {
                    _logger.LogWarning("Previendo descarte automático por presupuesto para {Phone}. Cambiando a 'Bajo'.", phone);
                    nivel = "Bajo";
                }
            }
        }

        if (contacto == null) return "Error: El contacto debe estar registrado antes de marcar interés.";

        var interest = await _context.ContactoInteresPropiedades
            .FirstOrDefaultAsync(i => i.ContactoId == contacto.Id && i.PropiedadId == propiedadId);

        if (interest == null)
        {
            interest = new ContactoInteresPropiedad
            {
                ContactoId = contacto.Id,
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

        await LogAiActionAsync("RegistroInteres", args.RootElement.GetRawText(), phone, triggerMessage, contacto.Id);
        
        return $"Interés registrado correctamente como '{nivel}'.";
    }
}
