using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Tools.ResumirHistorialContacto;

public sealed class ResumirHistorialContactoHandler : BaseCoreAiToolHandler
{
    public ResumirHistorialContactoHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<ResumirHistorialContactoHandler> logger) 
        : base(dbContextFactory, logger) { }

    public override string ToolName => "ResumirHistorialContacto";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string searchTerm = ExtractSafeString(args.RootElement, "searchTerm", 100, string.Empty);

        var agent = await ResolveIdentityAsync(context, cancellationToken);
        if (agent == null) return "{\"error\": \"Acceso denegado: No se pudo identificar al agente.\"}";

        string searchTermLower = searchTerm.ToLower();

        var result = await (from c in _context.Contactos
                                .Include(c => c.Tasks)
                                .Include(c => c.Interactions)
                            where c.AgenteId == agent.Id && 
                                  ((c.Nombre != null && c.Nombre.ToLower().Contains(searchTermLower)) || 
                                   (c.Apellido != null && c.Apellido.ToLower().Contains(searchTermLower)) || 
                                   ((c.Nombre ?? "") + " " + (c.Apellido ?? "")).ToLower().Contains(searchTermLower) ||
                                   (c.Telefono != null && c.Telefono.Contains(searchTerm)))
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
                                UltimasTareas = c.Tasks
                                    .OrderByDescending(t => t.FechaInicio)
                                    .Take(3)
                                    .Select(t => new { t.Titulo, t.Estado, t.FechaInicio }),
                                UltimasNotas = c.Interactions
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

