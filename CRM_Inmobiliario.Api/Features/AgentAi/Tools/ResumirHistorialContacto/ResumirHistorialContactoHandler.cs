using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using CRM_Inmobiliario.Api.Features.CoreAi.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Tools.ResumirHistorialContacto;

public sealed class ResumirHistorialContactoHandler : BaseCoreAiToolHandler
{
    public ResumirHistorialContactoHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<ResumirHistorialContactoHandler> logger) 
        : base(dbContextFactory, logger) { }

    public override string ToolName => "ResumirHistorialContacto";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        if (!string.Equals(context.Channel, "Copilot", StringComparison.OrdinalIgnoreCase))
        {
            return "Error: Acceso denegado. Esta herramienta es de uso exclusivo para el agente interno (Copilot).";
        }

        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string searchTerm = ExtractSafeString(args.RootElement, "searchTerm", 100, string.Empty);

        var agent = await ResolveIdentityAsync(context, cancellationToken);
        if (agent == null) return "{\"error\": \"Acceso denegado: No se pudo identificar al agente.\"}";

        string searchTermLower = searchTerm.ToLower(); // Solo para comparación de teléfono (ya es string en C#)
        var searchPattern = $"%{CrmDbContext.NormalizeText(searchTerm.Trim())}%";

        var result = await (from c in _context.Contactos
                            where c.AgenteId == agent.Id &&
                                  (EF.Functions.ILike(c.NormalizedSearchText, searchPattern) ||
                                   (c.Telefono != null && c.Telefono.Contains(searchTerm)) ||
                                   c.Id.ToString() == searchTerm)
                            let whatsapp = _context.WhatsappConversations
                                .OrderByDescending(w => w.UltimaActualizacion)
                                .FirstOrDefault(w => w.ContactoId == c.Id)
                            select new 
                            {
                                ContactId = c.Id,
                                Nombre = c.Nombre,
                                Telefono = c.Telefono,
                                EtapaEmbudo = c.EtapaEmbudo,
                                EsProspecto = c.EsProspecto,
                                EsPropietario = c.EsPropietario,
                                UltimasTareas = _context.Tasks
                                    .Where(t => t.ContactoId == c.Id)
                                    .OrderByDescending(t => t.FechaInicio)
                                    .Take(3)
                                    .Select(t => new { t.Titulo, t.Estado, t.FechaInicio }),
                                UltimasNotas = _context.Interactions
                                    .Where(i => i.ContactoId == c.Id)
                                    .OrderByDescending(i => i.FechaInteraccion)
                                    .Take(3)
                                    .Select(i => new { i.TipoInteraccion, i.Notas, i.FechaInteraccion }),
                                ConversacionWhatsApp = whatsapp != null ? whatsapp.HistorialJson : null
                            })
                            .FirstOrDefaultAsync();

        if (result == null)
        {
            return "{\"error\": \"Contacto no encontrado\"}";
        }

        await LogAiActionAsync("ResumirHistorialContacto", args.RootElement.GetRawText(), context);

        return JsonSerializer.Serialize(result);
    }
}

