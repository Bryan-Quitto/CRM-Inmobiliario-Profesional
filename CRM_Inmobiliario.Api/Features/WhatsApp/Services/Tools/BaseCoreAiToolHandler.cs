using System;
using System.Text.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public abstract class BaseCoreAiToolHandler : ICoreAiToolHandler
{
    protected readonly CrmDbContext _context;
    protected readonly ILogger _logger;

    protected BaseCoreAiToolHandler(CrmDbContext context, ILogger logger)
    {
        _context = context;
        _logger = logger;
    }

    public abstract string ToolName { get; }

    public abstract Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context);

    protected async Task LogAiActionAsync(string accion, string detalle, ToolExecutionContext context)
    {
        var log = new AiActionLog
        {
            Id = Guid.NewGuid(),
            TelefonoContacto = context.CustomerPhone ?? "N/A",
            ContactoId = context.Contacto?.Id,
            Accion = accion,
            DetalleJson = detalle,
            TriggerMessage = context.TriggerMessage,
            Fecha = DateTimeOffset.UtcNow
        };
        _context.AiActionLogs.Add(log);
    }
}



