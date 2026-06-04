using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using System.Text.Json;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Tools.CrearTareaCRM;

public sealed class CrearTareaCRMHandler : BaseCoreAiToolHandler
{
    public CrearTareaCRMHandler(CrmDbContext context, ILogger<CrearTareaCRMHandler> logger) 
        : base(context, logger) { }

    public override string ToolName => "CrearTareaCRM";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context)
    {
        string titulo = args.RootElement.TryGetProperty("titulo", out var t) ? t.GetString() ?? string.Empty : string.Empty;
        string descripcion = args.RootElement.TryGetProperty("descripcion", out var d) ? d.GetString() ?? string.Empty : string.Empty;
        string fechaProgramadaStr = args.RootElement.TryGetProperty("fechaProgramada", out var f) ? f.GetString() ?? string.Empty : string.Empty;
        
        Guid? contactoId = args.RootElement.TryGetProperty("contactoId", out var cid) && Guid.TryParse(cid.GetString(), out Guid parsedCid) ? parsedCid : null;
        Guid? propiedadId = args.RootElement.TryGetProperty("propiedadId", out var pid) && Guid.TryParse(pid.GetString(), out Guid parsedPid) ? parsedPid : null;

        if (string.IsNullOrEmpty(titulo) || string.IsNullOrEmpty(descripcion) || string.IsNullOrEmpty(fechaProgramadaStr))
        {
            return "Error: Título, descripción y fechaProgramada son obligatorios.";
        }

        if (!DateTimeOffset.TryParse(fechaProgramadaStr, out DateTimeOffset fechaProgramada))
        {
            return "Error: Formato de fechaProgramada inválido.";
        }

        Guid agenteId;
        if (contactoId.HasValue)
        {
            var contacto = await _context.Contactos.FirstOrDefaultAsync(c => c.Id == contactoId.Value);
            if (contacto == null) return "Error: ContactoId no encontrado.";
            agenteId = contacto.AgenteId;
        }
        else
        {
            // If we don't have a specific ContactoId, we try to use the current user's contact if any, 
            // otherwise fallback to Admin. Wait, let's check context.Contacto.
            if (context.Contacto != null)
            {
                agenteId = context.Contacto.AgenteId;
            }
            else
            {
                var fallbackAgent = await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin")
                                ?? await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync();
                
                if (fallbackAgent == null) return "Error: No se encontró agente para asignar la tarea.";
                agenteId = fallbackAgent.Id;
            }
        }

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            AgenteId = agenteId,
            ContactoId = contactoId,
            PropiedadId = propiedadId,
            Titulo = titulo,
            Descripcion = descripcion,
            TipoTarea = "Programada por IA",
            FechaInicio = fechaProgramada,
            DuracionMinutos = 30,
            Estado = "Pendiente"
        };

        _context.Tasks.Add(task);
        
        await LogAiActionAsync("CrearTareaCRM", args.RootElement.GetRawText(), context);

        return $"Tarea creada exitosamente con el ID {task.Id}. Se agendó para el {fechaProgramada:O}.";
    }
}
