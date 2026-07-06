using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using CRM_Inmobiliario.Api.Features.CoreAi.Tools;
using System.Text.Json;
using System.Linq;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Tools.ConsultarInteraccionesCliente;

public sealed class ConsultarInteraccionesClienteHandler : BaseCoreAiToolHandler
{
    public ConsultarInteraccionesClienteHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<ConsultarInteraccionesClienteHandler> logger) 
        : base(dbContextFactory, logger) { }

    public override string ToolName => "ConsultarInteraccionesCliente";

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

        var agent = await ResolveIdentityAsync(context, cancellationToken);
        if (agent == null) return "{\"error\": \"Acceso denegado: No se pudo identificar al agente.\"}";

        int requestedCantidad = args.RootElement.TryGetProperty("cantidadInteracciones", out var prop) && prop.TryGetInt32(out var cant) ? cant : 20;
        int cantidadInteracciones = Math.Clamp(requestedCantidad, 1, 50);
        string? tipoInteraccion = args.RootElement.TryGetProperty("tipoInteraccion", out var tipoProp) && tipoProp.ValueKind == JsonValueKind.String ? tipoProp.GetString() : null;

        string? notaSistema = null;
        if (requestedCantidad > 50)
        {
            notaSistema = $"[SISTEMA] Se solicitaron {requestedCantidad} interacciones, pero el límite técnico es 50. Se devolvieron las últimas 50. Notifica amablemente de este límite al agente.";
        }
        else if (requestedCantidad < 1)
        {
            notaSistema = $"[SISTEMA] Cantidad inválida solicitada ({requestedCantidad}). Se devolvió 1 interacción. Notifica de esto al agente.";
        }

        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string contactId = context.FocusedContextId;

        var query = _context.Interactions
            .Where(i => i.AgenteId == agent.Id && i.ContactoId.ToString() == contactId);

        if (!string.IsNullOrEmpty(tipoInteraccion))
        {
            query = query.Where(i => EF.Functions.ILike(i.TipoInteraccion, $"%{tipoInteraccion}%"));
        }

        var interacciones = await query
            .OrderByDescending(i => i.FechaInteraccion)
            .Take(cantidadInteracciones)
            .Select(i => new
            {
                fecha = i.FechaInteraccion.ToString("s"),
                tipo = i.TipoInteraccion,
                notas = i.Notas
            })
            .ToListAsync(cancellationToken);

        if (!interacciones.Any())
        {
            if (!string.IsNullOrEmpty(tipoInteraccion))
            {
                return $"El contacto no tiene interacciones registradas que coincidan con el tipo '{tipoInteraccion}'. Dile al usuario que intente con otro tipo o sin filtros.";
            }
            return "El contacto no tiene interacciones registradas.";
        }

        await LogAiActionAsync("ConsultarInteraccionesCliente", "{}", context);

        var finalResult = new
        {
            Interacciones = interacciones,
            NotaSistema = notaSistema
        };

        return JsonSerializer.Serialize(finalResult);
    }
}
