using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using System.Text.Json;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public sealed class WhatsAppToolExecutor : IWhatsAppToolExecutor
{
    private readonly CrmDbContext _context;
    private readonly ILogger<WhatsAppToolExecutor> _logger;
    private readonly IEnumerable<IWhatsAppToolHandler> _handlers;

    public WhatsAppToolExecutor(
        CrmDbContext context, 
        ILogger<WhatsAppToolExecutor> logger,
        IEnumerable<IWhatsAppToolHandler> handlers)
    {
        _context = context;
        _logger = logger;
        _handlers = handlers;
    }

    public async Task<string> HandleToolCallAsync(ChatToolCall toolCall, string customerPhone, string triggerMessage, Lead? currentLead)
    {
        _logger.LogInformation("Ejecutando herramienta: {ToolName} para {Phone}", toolCall.FunctionName, customerPhone);
        
        using JsonDocument args = JsonDocument.Parse(toolCall.FunctionArguments);

        try 
        {
            var handler = _handlers.FirstOrDefault(h => h.ToolName == toolCall.FunctionName);
            
            if (handler == null)
            {
                _logger.LogWarning("Herramienta no encontrada: {ToolName}", toolCall.FunctionName);
                return "Error: Herramienta no encontrada.";
            }

            var result = await handler.ExecuteAsync(args, customerPhone, triggerMessage, currentLead);
            
            // Centralizamos el guardado de cambios para asegurar que las acciones de los handlers (logs, updates) persistan
            await _context.SaveChangesAsync();
            
            return result;
        } 
        catch (Exception ex) 
        {
            _logger.LogError(ex, "Error ejecutando herramienta {ToolName}", toolCall.FunctionName);
            return "Error al ejecutar la acción.";
        }
    }
}
