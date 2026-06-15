using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Tools;

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
        _logger.LogInformation("Iniciando RegistrarInteresContacto con Args: {Args}", args.RootElement.GetRawText());
        
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        
        if (!args.RootElement.TryGetProperty("nombrePropiedad", out var pNameProp))
        {
            return "Error: No se envió el parámetro nombrePropiedad.";
        }

        string pNameStr = pNameProp.GetString() ?? string.Empty;
        Guid propiedadId;

        // Búsqueda robusta por título o ID
        string searchTerm = pNameStr.Trim();
        var searchPattern = $"%{CrmDbContext.NormalizeText(searchTerm)}%";
        var propertyByTitle = await _context.Properties
            .Where(p => EF.Functions.ILike(p.NormalizedSearchText, searchPattern) || p.Id.ToString() == searchTerm)
            .FirstOrDefaultAsync();
        
        if (propertyByTitle != null)
        {
            propiedadId = propertyByTitle.Id;
            _logger.LogInformation("Resolución semántica exitosa: Se mapeó '{Nombre}' al Guid {Guid}", pNameStr, propiedadId);
        }
        else
        {
            _logger.LogWarning("RegistrarInteresContacto falló: No se encontró la propiedad con el nombre: {Valor}", pNameStr);
            return $"Error: No se encontró ninguna propiedad que coincida con el nombre '{pNameStr}'.";
        }

        var identity = await ResolveIdentityAsync(context, cancellationToken);
        Guid? currentAgentId = identity?.Id;
        Guid? currentAgencyId = identity?.AgenciaId;

        var baseQuery = _context.Properties.AsQueryable();
        if (currentAgencyId != null || currentAgentId != null)
        {
            baseQuery = baseQuery.Where(p => 
                (currentAgencyId != null && p.AgenciaId == currentAgencyId) || 
                (currentAgentId != null && (p.AgenteId == currentAgentId || p.CreatedByAgenteId == currentAgentId)));
        }

        bool propertyExists = await baseQuery.AnyAsync(p => p.Id == propiedadId);
        if (!propertyExists)
            return "Error: La propiedad con ese ID no existe en la base de datos o no tienes permiso para verla. Por favor verifica el ID.";

        NivelInteresPermitido nivelEnum = ExtractSafeEnum(args.RootElement, "nivelInteres", NivelInteresPermitido.Medio);
        string nivel = nivelEnum.ToString();
        
        if (nivel == "Descartada" && context.ContactoId.HasValue)
        {
            string history = string.Empty;
            if (context.Channel == "WhatsApp")
            {
                var conv = await _context.WhatsappConversations.FirstOrDefaultAsync(c => c.ContactoId == context.ContactoId.Value);
                history = conv?.HistorialJson ?? string.Empty;
            }
            else if (context.Channel == "Facebook")
            {
                var conv = await _context.FacebookConversations.FirstOrDefaultAsync(c => c.ContactoId == context.ContactoId.Value);
                history = conv?.HistorialJson ?? string.Empty;
            }

            history = history.ToLower();
            if ((history.Contains("presupuesto") || history.Contains("$") || history.Contains("precio") || history.Contains("barat")) 
                && !history.Contains("no me gusta") && !history.Contains("feo") && !history.Contains("descart") && !history.Contains("quitar"))
            {
                _logger.LogWarning("Previendo descarte automático por presupuesto para Contacto {ContactoId}. Cambiando a 'Bajo'.", context.ContactoId.Value);
                nivel = "Bajo";
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

        var customDetalle = new 
        { 
            nombrePropiedad = pNameStr, 
            nivelInteres = nivel, 
            propiedadId = propiedadId 
        };
        await LogAiActionAsync("RegistroInteres", JsonSerializer.Serialize(customDetalle), context);
        
        return $"Interés registrado correctamente como '{nivel}'.";
    }
}






