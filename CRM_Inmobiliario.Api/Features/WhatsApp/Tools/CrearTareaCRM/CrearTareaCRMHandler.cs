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
    public CrearTareaCRMHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<CrearTareaCRMHandler> logger) 
        : base(dbContextFactory, logger) { }

    public override string ToolName => "CrearTareaCRM";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string titulo = ExtractSafeString(args.RootElement, "titulo", 100, string.Empty);
        string descripcion = ExtractSafeString(args.RootElement, "descripcion", 1000, string.Empty);
        
        Guid? contactoId = args.RootElement.TryGetProperty("contactoId", out var cid) && Guid.TryParse(cid.GetString(), out Guid parsedCid) ? parsedCid : null;
        Guid? propiedadId = args.RootElement.TryGetProperty("propiedadId", out var pid) && Guid.TryParse(pid.GetString(), out Guid parsedPid) ? parsedPid : null;

        if (string.IsNullOrEmpty(titulo) || string.IsNullOrEmpty(descripcion))
        {
            return "Error: Título y descripción son obligatorios.";
        }

        if (!TryExtractSafeFutureDate(args.RootElement, "fechaProgramada", out DateTimeOffset fechaProgramada, out string errorFecha, 2))
        {
            return errorFecha;
        }
        if (fechaProgramada == DateTimeOffset.MinValue)
        {
            return "Error: fechaProgramada es obligatoria y debe tener un formato válido.";
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
            if (context.ContactoId.HasValue)
            {
                var contextContacto = await _context.Contactos.FindAsync(new object[] { context.ContactoId.Value }, cancellationToken);
                if (contextContacto != null)
                {
                    agenteId = contextContacto.AgenteId;
                }
                else
                {
                    var fallbackAgent = await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin", cancellationToken)
                                    ?? await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync(cancellationToken);
                    
                    if (fallbackAgent == null) return "Error: No se encontró agente para asignar la tarea.";
                    agenteId = fallbackAgent.Id;
                }
            }
            else
            {
                var fallbackAgent = await _context.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin", cancellationToken)
                                ?? await _context.Agents.OrderBy(a => a.FechaCreacion).FirstOrDefaultAsync(cancellationToken);
                
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

