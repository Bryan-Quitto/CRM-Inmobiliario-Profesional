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

        if (string.IsNullOrEmpty(context.FocusedContextId))
        {
            return "Error: No se encontró un contexto de contacto activo. Debes usar la vista de detalles del contacto.";
        }

        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string searchTerm = context.FocusedContextId;
        int requestedCantidad = args.RootElement.TryGetProperty("cantidadMensajes", out var prop) && prop.TryGetInt32(out var cant) ? cant : 20;
        int cantidadMensajes = Math.Clamp(requestedCantidad, 1, 50);
        
        string? notaSistema = null;
        if (requestedCantidad > 50)
        {
            notaSistema = $"[SISTEMA] Se solicitaron {requestedCantidad} mensajes, pero el límite técnico es 50. Se devolvieron los últimos 50. Notifica amablemente de este límite al agente.";
        }
        else if (requestedCantidad < 1)
        {
            notaSistema = $"[SISTEMA] Cantidad inválida solicitada ({requestedCantidad}). Se devolvió 1 mensaje. Notifica de esto al agente.";
        }


        var agent = await ResolveIdentityAsync(context, cancellationToken);
        if (agent == null) return "{\"error\": \"Acceso denegado: No se pudo identificar al agente.\"}";

        var result = await (from c in _context.Contactos
                            where c.AgenteId == agent.Id && c.Id.ToString() == searchTerm
                            select new 
                            {
                                ContactId = c.Id,
                                Nombre = c.Nombre,
                                Telefono = c.Telefono,
                                EstadoEmbudo = c.EstadoEmbudo,
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
                                WaMessages = _context.WhatsappMessages
                                    .Where(m => m.ContactoId == c.Id)
                                    .OrderByDescending(m => m.Fecha)
                                    .Take(cantidadMensajes)
                                    .Select(m => new { m.Fecha, m.OrigenMensaje, m.Rol, m.Contenido }),
                                FbMessages = _context.FacebookMessages
                                    .Where(m => m.ContactoId == c.Id)
                                    .OrderByDescending(m => m.Fecha)
                                    .Take(cantidadMensajes)
                                    .Select(m => new { m.Fecha, m.OrigenMensaje, m.Rol, m.Contenido })
                            })
                            .FirstOrDefaultAsync();

        if (result == null)
        {
            return "{\"error\": \"Contacto no encontrado\"}";
        }

        var historialUnificado = result.WaMessages.Select(m => new { m.Fecha, Canal = "WhatsApp", Origen = m.OrigenMensaje ?? (m.Rol == "user" ? "Cliente" : "IA"), Mensaje = m.Contenido })
            .Concat(result.FbMessages.Select(m => new { m.Fecha, Canal = "Facebook", Origen = m.OrigenMensaje ?? (m.Rol == "user" ? "Cliente" : "IA"), Mensaje = m.Contenido }))
            .OrderBy(m => m.Fecha)
            .TakeLast(cantidadMensajes)
            .Select(m => new { 
                fecha = m.Fecha.ToString("s"), 
                canal = m.Canal, 
                origen = m.Origen, 
                mensaje = m.Mensaje 
            });

        var finalResult = new
        {
            result.ContactId,
            result.Nombre,
            result.Telefono,
            result.EstadoEmbudo,
            result.EsProspecto,
            result.EsPropietario,
            result.UltimasTareas,
            result.UltimasNotas,
            HistorialUnificado = historialUnificado,
            NotaSistema = notaSistema
        };

        await LogAiActionAsync("ResumirHistorialContacto", args.RootElement.GetRawText(), context);

        return JsonSerializer.Serialize(finalResult);
    }
}

