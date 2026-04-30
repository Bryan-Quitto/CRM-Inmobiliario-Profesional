using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class RegistrarNuevoLeadHandler : BaseWhatsAppToolHandler
{
    public RegistrarNuevoLeadHandler(CrmDbContext context, ILogger<RegistrarNuevoLeadHandler> logger) 
        : base(context, logger) { }

    public override string ToolName => "RegistrarNuevoLead";

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Lead? lead)
    {
        string nombre = args.RootElement.GetProperty("nombre").GetString() ?? "Desconocido";
        
        // Búsqueda inteligente para evitar duplicados en registro
        string searchPhone = phone.StartsWith("+") ? phone : "+" + phone;
        var existing = await _context.Leads.FirstOrDefaultAsync(l => l.Telefono == phone || l.Telefono == searchPhone);
        if (existing != null) return "El cliente ya está registrado.";

        // Intentar asignar al Admin ID estándar del proyecto
        var adminId = Guid.Parse("d4a6efdd-b801-40fb-901e-64e36f6b1400");
        var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Id == adminId)
                    ?? await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync();

        if (agent == null) return "No hay agentes disponibles para asignar.";

        var newLead = new Lead
        {
            Id = Guid.NewGuid(),
            Nombre = nombre,
            Telefono = phone,
            Origen = "IA WhatsApp",
            AgenteId = agent.Id,
            FechaCreacion = DateTimeOffset.UtcNow,
            EtapaEmbudo = "Nuevo"
        };

        _context.Leads.Add(newLead);
        await LogAiActionAsync("Registro Lead", args.RootElement.GetRawText(), phone, triggerMessage, newLead.Id);
        
        // Nota: SaveChangesAsync() se llama en el executor
        return "Cliente registrado correctamente.";
    }
}
