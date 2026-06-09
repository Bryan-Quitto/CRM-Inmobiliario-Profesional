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
    public SolicitarAsistenciaHumanaHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<SolicitarAsistenciaHumanaHandler> logger) 
        : base(dbContextFactory, logger) { }

    public override string ToolName => "SolicitarAsistenciaHumana";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string motivo = ExtractSafeString(args.RootElement, "motivo", 500, "No especificado");
        await LogAiActionAsync("Alerta", args.RootElement.GetRawText(), context, cancellationToken);
        
        var identity = await ResolveIdentityAsync(context, cancellationToken);
        Guid? currentAgentId = identity?.Id;

        Contacto? contacto = null;
        if (context.ContactoId.HasValue)
        {
            contacto = await _context.Contactos.FindAsync(new object[] { context.ContactoId.Value }, cancellationToken);
        }

        if (contacto == null)
        {
            var agentIdToUse = currentAgentId ?? (await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin", cancellationToken))?.Id
                               ?? (await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync(cancellationToken))?.Id;

            contacto = new Contacto
            {
                Id = Guid.NewGuid(),
                Nombre = "Usuario Desconocido",
                Telefono = context.CustomerPhone ?? string.Empty,
                Origen = "IA WhatsApp",
                AgenteId = agentIdToUse ?? Guid.Empty,
                FechaCreacion = DateTimeOffset.UtcNow,
                EtapaEmbudo = "Nuevo",
                EstadoIA_WA = "Escalado",
                EsProspecto = true,
                Notas = $"Escalamiento: {motivo}",
                BotActivoWA = false,
                TransferenciaNotificada = true
            };
            _context.Contactos.Add(contacto);
        }
        else
        {
            contacto.EstadoIA_WA = "Escalado";
            contacto.Notas = string.IsNullOrWhiteSpace(contacto.Notas) 
                ? $"Escalamiento: {motivo}" 
                : $"{contacto.Notas}\nEscalamiento: {motivo}";
            
            contacto.BotActivoWA = false;
            contacto.TransferenciaNotificada = true;
            
            _context.Contactos.Update(contacto);
        }
        
        await _context.SaveChangesAsync(cancellationToken);

        return "Solicitud de asistencia enviada al equipo humano.";
    }
}
