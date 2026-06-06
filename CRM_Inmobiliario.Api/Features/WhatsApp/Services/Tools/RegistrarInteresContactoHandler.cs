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
    public RegistrarInteresContactoHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<RegistrarInteresContactoHandler> logger) 
        : base(dbContextFactory, logger) { }

    private enum NivelInteresPermitido
    {
        Alto,
        Medio,
        Bajo,
        Descartada
    }

    public override string ToolName => "RegistrarInteresContacto";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        if (!args.RootElement.TryGetProperty("propiedadId", out var pIdProp) || !Guid.TryParse(pIdProp.GetString(), out var propiedadId))
            return "Error: ID de propiedad inválido.";

        bool propertyExists = await _context.Properties.AnyAsync(p => p.Id == propiedadId);
        if (!propertyExists)
            return "Error: La propiedad con ese ID no existe en la base de datos. Por favor verifica el ID o pide disculpas al usuario por la confusión.";

        NivelInteresPermitido nivelEnum = ExtractSafeEnum(args.RootElement, "nivelInteres", NivelInteresPermitido.Medio);
        string nivel = nivelEnum.ToString();
        
        if (nivel == "Descartada")
        {
            var conversation = await _context.WhatsappConversations.FirstOrDefaultAsync(c => c.Telefono == context.CustomerPhone);
            if (conversation != null)
            {
                var history = conversation.HistorialJson.ToLower();
                if ((history.Contains("presupuesto") || history.Contains("$") || history.Contains("precio") || history.Contains("barat")) 
                    && !history.Contains("no me gusta") && !history.Contains("feo") && !history.Contains("descart") && !history.Contains("quitar"))
                {
                    _logger.LogWarning("Previendo descarte automático por presupuesto para {CustomerPhone}. Cambiando a 'Bajo'.", context.CustomerPhone);
                    nivel = "Bajo";
                }
            }
        }

        if (context.ContactoId == null) return "Error: El contacto debe estar registrado antes de marcar interés.";

        var interest = await _context.ContactoInteresPropiedades
            .FirstOrDefaultAsync(i => i.ContactoId == context.ContactoId.Value && i.PropiedadId == propiedadId);

        if (interest == null)
        {
            interest = new ContactoInteresPropiedad
            {
                ContactoId = context.ContactoId.Value,
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

        await _context.SaveChangesAsync(cancellationToken);

        await LogAiActionAsync("RegistroInteres", args.RootElement.GetRawText(), context);
        
        return $"Interés registrado correctamente como '{nivel}'.";
    }
}






