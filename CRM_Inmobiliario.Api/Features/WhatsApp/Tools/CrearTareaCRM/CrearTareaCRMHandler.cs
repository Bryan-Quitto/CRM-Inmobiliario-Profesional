using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using CRM_Inmobiliario.Api.Features.CoreAi.Tools;
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
        string tipoTarea = ExtractSafeString(args.RootElement, "tipoTarea", 50, string.Empty);

        Guid? contactoId = args.RootElement.TryGetProperty("contactoId", out var cid) && Guid.TryParse(cid.GetString(), out Guid parsedCid) ? parsedCid : null;
        Guid? propiedadId = args.RootElement.TryGetProperty("propiedadId", out var pid) && Guid.TryParse(pid.GetString(), out Guid parsedPid) ? parsedPid : null;

        string contactoBusqueda = ExtractSafeString(args.RootElement, "contactoBusqueda", 100, string.Empty);
        string propiedadBusqueda = ExtractSafeString(args.RootElement, "propiedadBusqueda", 100, string.Empty);

        if (string.IsNullOrEmpty(titulo) || string.IsNullOrEmpty(descripcion) || string.IsNullOrEmpty(tipoTarea))
        {
            return "Error: Título, descripción y tipoTarea son obligatorios.";
        }

        if (!TryExtractSafeFutureDate(args.RootElement, "fechaProgramada", out DateTimeOffset fechaProgramada, out string errorFecha, 2))
        {
            return errorFecha;
        }
        if (fechaProgramada == DateTimeOffset.MinValue)
        {
            return "Error: fechaProgramada es obligatoria y debe tener un formato válido.";
        }

        var agent = await ResolveIdentityAsync(context, cancellationToken);
        if (agent == null) return "Error: No se pudo identificar al agente.";

        Guid agenteId = agent.Id;

        bool needsConfirmation = false;
        var confirmationMessages = new System.Text.StringBuilder();

        if (!contactoId.HasValue && !string.IsNullOrEmpty(contactoBusqueda))
        {
            needsConfirmation = true;
            string contactoBusquedaLower = contactoBusqueda.ToLower();
            var matchContacto = await _context.Contactos
                .Where(c => c.AgenteId == agenteId && (
                    (c.Nombre != null && c.Nombre.ToLower().Contains(contactoBusquedaLower)) ||
                    (c.Apellido != null && c.Apellido.ToLower().Contains(contactoBusquedaLower)) ||
                    ((c.Nombre ?? "") + " " + (c.Apellido ?? "")).ToLower().Contains(contactoBusquedaLower) ||
                    (c.Telefono != null && c.Telefono.Contains(contactoBusqueda))
                ))
                .FirstOrDefaultAsync(cancellationToken);
            
            if (matchContacto != null)
            {
                confirmationMessages.AppendLine($"Contacto sugerido: [👤 Ver Perfil: {matchContacto.Nombre}](/contactos/{matchContacto.Id})");
            }
            else
            {
                confirmationMessages.AppendLine($"⚠ No encontré ningún contacto similar a '{contactoBusqueda}'. 💡 Sugerencia: Pídele al usuario que escriba el nombre y apellido completos separados por un espacio, o que te dé el número de teléfono exacto.");
            }
        }

        if (!propiedadId.HasValue && !string.IsNullOrEmpty(propiedadBusqueda))
        {
            needsConfirmation = true;
            var matchPropiedad = await _context.Properties
                .Where(p => p.AgenciaId == agent.AgenciaId && p.Titulo.ToLower().Contains(propiedadBusqueda.ToLower()))
                .FirstOrDefaultAsync(cancellationToken);
            
            if (matchPropiedad != null)
            {
                confirmationMessages.AppendLine($"Propiedad sugerida: [🏠 Ver Ficha Completa: {matchPropiedad.Titulo}](/propiedades/{matchPropiedad.Id})");
            }
            else
            {
                confirmationMessages.AppendLine($"⚠ No encontré ninguna propiedad similar a '{propiedadBusqueda}'.");
            }
        }

        if (needsConfirmation)
        {
            return $"INSTRUCCIÓN CRÍTICA: AÚN NO HAS CREADO LA TAREA. Resultado de tu búsqueda:\n{confirmationMessages}\nPor favor, muéstrale este resultado al usuario exactamente. Si encontraste coincidencias, pon los accesos directos y pregúntale: '¿Te refieres a estos registros para agendar la cita?'. Si no encontraste algo, infórmaselo. NO VUELVAS A LLAMAR A LA HERRAMIENTA hasta que el humano te responda.";
        }

        if (contactoId.HasValue)
        {
            var contacto = await _context.Contactos.FirstOrDefaultAsync(c => c.Id == contactoId.Value);
            if (contacto == null) return "Error: ContactoId no encontrado.";
            if (contacto.AgenteId != agenteId) return "Error: No tienes permiso para asignar tareas a este contacto.";
        }
        else if (context.ContactoId.HasValue)
        {
            contactoId = context.ContactoId.Value;
        }

        var task = new TaskItem
        {
            Id = Guid.NewGuid(),
            AgenteId = agenteId,
            ContactoId = contactoId,
            PropiedadId = propiedadId,
            Titulo = titulo,
            Descripcion = descripcion,
            TipoTarea = tipoTarea,
            FechaInicio = fechaProgramada,
            DuracionMinutos = 30,
            Estado = "Pendiente"
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync(cancellationToken);
        
        await LogAiActionAsync("CrearTareaCRM", args.RootElement.GetRawText(), context);

        return $"Tarea creada exitosamente con el ID {task.Id}. Se agendó para el {fechaProgramada:O}.\nCRÍTICO: Debes incluir EXACTAMENTE esta cadena de texto oculta al inicio de tu respuesta al usuario para actualizar la interfaz: [SystemAction: InvalidateCache=/tareas]";
    }
}

