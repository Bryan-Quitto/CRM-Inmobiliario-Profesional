using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

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

    public async Task<string> HandleToolCallAsync(AiToolCall toolCall, string customerPhone, string triggerMessage, Contacto? currentContacto, string phoneNumberId)
    {
        _logger.LogInformation("Ejecutando herramienta: {ToolName} para {Phone}", toolCall.Name, customerPhone);
        
        using JsonDocument args = JsonDocument.Parse(toolCall.Arguments);

        try 
        {
            var handler = _handlers.FirstOrDefault(h => h.ToolName == toolCall.Name);
            
            if (handler == null)
            {
                _logger.LogWarning("Herramienta no encontrada: {ToolName}", toolCall.Name);
                return "Error: Herramienta no encontrada.";
            }

            var result = await handler.ExecuteAsync(args, customerPhone, triggerMessage, currentContacto, phoneNumberId);
            
            // Centralizamos el guardado de cambios para asegurar que las acciones de los handlers (logs, updates) persistan
            await _context.SaveChangesAsync();
            
            return result;
        } 
        catch (Exception ex) 
        {
            _logger.LogError(ex, "Error ejecutando herramienta {ToolName}", toolCall.Name);
            return "Error al ejecutar la acción.";
        }
    }
}
