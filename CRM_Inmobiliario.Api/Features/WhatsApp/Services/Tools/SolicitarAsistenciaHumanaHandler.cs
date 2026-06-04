using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class SolicitarAsistenciaHumanaHandler : BaseCoreAiToolHandler
{
    public SolicitarAsistenciaHumanaHandler(CrmDbContext context, ILogger<SolicitarAsistenciaHumanaHandler> logger) 
        : base(context, logger) { }

    public override string ToolName => "SolicitarAsistenciaHumana";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context)
    {
        string motivo = args.RootElement.TryGetProperty("motivo", out var m) ? m.GetString() ?? "No especificado" : "No especificado";
        await LogAiActionAsync("Alerta", args.RootElement.GetRawText(), context);
        
        if (context.Contacto == null)
        {
            var agent = await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin")
                        ?? await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync();

            context.Contacto = new Contacto
            {
                Id = Guid.NewGuid(),
                Nombre = "Usuario Desconocido",
                Telefono = context.CustomerPhone ?? string.Empty,
                Origen = "IA WhatsApp",
                AgenteId = agent?.Id ?? Guid.Empty,
                FechaCreacion = DateTimeOffset.UtcNow,
                EtapaEmbudo = "Nuevo",
                EstadoIA = "Escalado",
                EsProspecto = true,
                Notas = $"Escalamiento: {motivo}",
                BotActivo = false,
                TransferenciaNotificada = true
            };
            _context.Contactos.Add(context.Contacto);
        }
        else
        {
            context.Contacto.EstadoIA = "Escalado";
            context.Contacto.Notas = string.IsNullOrWhiteSpace(context.Contacto.Notas) 
                ? $"Escalamiento: {motivo}" 
                : $"{context.Contacto.Notas}\nEscalamiento: {motivo}";
            
            context.Contacto.BotActivo = false;
            context.Contacto.TransferenciaNotificada = true;
            
            _context.Contactos.Update(context.Contacto);
        }
        
        await _context.SaveChangesAsync();

        return "Solicitud de asistencia enviada al equipo humano.";
    }
}






