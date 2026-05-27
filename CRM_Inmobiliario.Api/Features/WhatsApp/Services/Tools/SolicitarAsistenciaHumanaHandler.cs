using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class SolicitarAsistenciaHumanaHandler : BaseWhatsAppToolHandler
{
    public SolicitarAsistenciaHumanaHandler(CrmDbContext context, ILogger<SolicitarAsistenciaHumanaHandler> logger) 
        : base(context, logger) { }

    public override string ToolName => "SolicitarAsistenciaHumana";

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Contacto? contacto, string phoneNumberId)
    {
        string motivo = args.RootElement.TryGetProperty("motivo", out var m) ? m.GetString() ?? "No especificado" : "No especificado";
        await LogAiActionAsync("Alerta", args.RootElement.GetRawText(), phone, triggerMessage, contacto?.Id);
        
        if (contacto == null)
        {
            var adminId = Guid.Parse("d4a6efdd-b801-40fb-901e-64e36f6b1400");
            var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Id == adminId)
                        ?? await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync();

            contacto = new Contacto
            {
                Id = Guid.NewGuid(),
                Nombre = "Usuario Desconocido",
                Telefono = phone,
                Origen = "IA WhatsApp",
                AgenteId = agent?.Id ?? adminId,
                FechaCreacion = DateTimeOffset.UtcNow,
                EtapaEmbudo = "Escalado",
                EsProspecto = true,
                Notas = $"Escalamiento: {motivo}",
                BotActivo = false,
                TransferenciaNotificada = true
            };
            _context.Contactos.Add(contacto);
        }
        else
        {
            contacto.EtapaEmbudo = "Escalado";
            contacto.Notas = string.IsNullOrWhiteSpace(contacto.Notas) 
                ? $"Escalamiento: {motivo}" 
                : $"{contacto.Notas}\nEscalamiento: {motivo}";
            
            contacto.BotActivo = false;
            contacto.TransferenciaNotificada = true;
            
            _context.Contactos.Update(contacto);
        }
        
        await _context.SaveChangesAsync();

        return "Solicitud de asistencia enviada al equipo humano.";
    }
}
