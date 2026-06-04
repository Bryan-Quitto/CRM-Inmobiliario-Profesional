using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools; // Moveremos/cambiaremos los handlers?

namespace CRM_Inmobiliario.Api.Features.CoreAi.Services;

public sealed class CoreAiToolExecutor : ICoreAiToolExecutor
{
    private readonly ILogger<CoreAiToolExecutor> _logger;
    private readonly IEnumerable<ICoreAiToolHandler> _handlers;

    public CoreAiToolExecutor(
        ILogger<CoreAiToolExecutor> logger,
        IEnumerable<ICoreAiToolHandler> handlers)
    {
        _logger = logger;
        _handlers = handlers;
    }

    public async Task<string> HandleToolCallAsync(AiToolCall toolCall, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Ejecutando herramienta: {ToolName} para Usuario {UserId} en {Channel}", toolCall.Name, context.UserId, context.Channel);
        
        using JsonDocument args = JsonDocument.Parse(toolCall.Arguments);

        try 
        {
            var handler = _handlers.FirstOrDefault(h => h.ToolName == toolCall.Name);
            
            if (handler == null)
            {
                _logger.LogWarning("Herramienta no encontrada: {ToolName}", toolCall.Name);
                return "Error: Herramienta no encontrada.";
            }

            var result = await handler.ExecuteAsync(args, context, cancellationToken);

            
            return result;
        } 
        catch (Exception ex) 
        {
            _logger.LogError(ex, "Error ejecutando herramienta {ToolName}", toolCall.Name);
            return "Error al ejecutar la acción.";
        }
    }
}
