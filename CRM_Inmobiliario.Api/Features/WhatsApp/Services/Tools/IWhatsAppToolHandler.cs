using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public interface IWhatsAppToolHandler
{
    string ToolName { get; }
    Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Contacto? contacto);
}
