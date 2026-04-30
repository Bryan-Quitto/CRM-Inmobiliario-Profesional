using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public abstract class BaseWhatsAppToolHandler : IWhatsAppToolHandler
{
    protected readonly CrmDbContext _context;
    protected readonly ILogger _logger;

    protected BaseWhatsAppToolHandler(CrmDbContext context, ILogger logger)
    {
        _context = context;
        _logger = logger;
    }

    public abstract string ToolName { get; }

    public abstract Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Lead? lead);

    protected async Task LogAiActionAsync(string accion, string detalle, string phone, string triggerMessage, Guid? leadId = null)
    {
        var log = new AiActionLog
        {
            Id = Guid.NewGuid(),
            TelefonoCliente = phone,
            ClienteId = leadId,
            Accion = accion,
            DetalleJson = detalle,
            TriggerMessage = triggerMessage,
            Fecha = DateTimeOffset.UtcNow
        };
        _context.AiActionLogs.Add(log);
        // Nota: El SaveChanges lo manejamos en el Executor o al final del Handler según corresponda
    }
}
