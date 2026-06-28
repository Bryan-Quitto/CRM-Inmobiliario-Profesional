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

namespace CRM_Inmobiliario.Api.Features.AgentAi.Tools.ConsultarInteraccionesContacto;

public sealed class ConsultarInteraccionesContactoHandler : BaseCoreAiToolHandler
{
    public ConsultarInteraccionesContactoHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<ConsultarInteraccionesContactoHandler> logger) 
        : base(dbContextFactory, logger) { }

    public override string ToolName => "ConsultarInteraccionesContacto";

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

        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string contactId = context.FocusedContextId;

        var interacciones = await _context.Interactions
            .Where(i => i.AgenteId == agent.Id && i.ContactoId.ToString() == contactId)
            .OrderByDescending(i => i.FechaInteraccion)
            .Take(20) // Limite seguro para tokens
            .Select(i => new
            {
                fecha = i.FechaInteraccion.ToString("s"),
                tipo = i.TipoInteraccion,
                notas = i.Notas
            })
            .ToListAsync(cancellationToken);

        if (!interacciones.Any())
        {
            return "El contacto no tiene interacciones registradas.";
        }

        await LogAiActionAsync("ConsultarInteraccionesContacto", "{}", context);

        return JsonSerializer.Serialize(interacciones);
    }
}
