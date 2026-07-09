using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class CambiarEstadoContactoFeature
{
    public record Command(string NuevoEstado, string Tipo, decimal? PrecioCierre = null, Guid? PropiedadId = null);

    public static void MapCambiarEstadoContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/contactos/{id:guid}/estado", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, ILogger<CrmDbContext> logger, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var esTipoPropietario = string.Equals(command.Tipo, "Propietario", StringComparison.OrdinalIgnoreCase);
            
            logger.LogInformation("[CierreDebug] Iniciando cambio de etapa para contacto {Id} a '{Etapa}' (Tipo: {Tipo}).", id, command.NuevoEstado, command.Tipo);

            // 1. Validar que la nueva etapa sea válida para el tipo
            var estadosValidos = esTipoPropietario
                ? new[] { "Activo", "Inactivo" } 
                : new[] { "Nuevo", "Contactado", "Visita", "Perdido" }; 

            if (!estadosValidos.Contains(command.NuevoEstado))
            {
                return Results.BadRequest(new { Message = $"Etapa '{command.NuevoEstado}' no válida para el tipo '{command.Tipo}' o prohibida de cambio manual." });
            }

            try
            {
                // Buscar contacto
                var contacto = await context.Contactos
                    .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId, ct);

                if (contacto == null)
                {
                    return Results.NotFound();
                }

                if (await context.AgentArchivedContacts.AnyAsync(a => a.AgentId == agenteId && a.ContactoId == id, ct))
                {
                    return Results.BadRequest(new { message = "No puedes modificar un registro archivado" });
                }

                // 2. Bloqueos Estrictos de Negocio
                if (esTipoPropietario)
                {
                    if (contacto.EstadoPropietario == "Cerrado" && command.NuevoEstado != "Cerrado")
                    {
                        return Results.BadRequest(new { Message = "El propietario está en estado 'Cerrado'. Este estado es gestionado automáticamente por sus propiedades y no se puede alterar manualmente." });
                    }
                    else if (contacto.EstadoPropietario == "Inactivo" && command.NuevoEstado != "Activo" && command.NuevoEstado != "Inactivo")
                    {
                        return Results.BadRequest(new { Message = $"Transición no permitida desde 'Inactivo' hacia '{command.NuevoEstado}'." });
                    }
                }
                else
                {
                    if (contacto.EstadoEmbudo == "En Negociación")
                    {
                        return Results.BadRequest(new { Message = "El cliente está en medio de una negociación. Cualquier cambio debe realizarse desde el catálogo de propiedades." });
                    }
                    if ((contacto.EstadoEmbudo == "Cerrado" || contacto.EstadoEmbudo == "Cerrado Ganado") && command.NuevoEstado == "Perdido")
                    {
                        return Results.BadRequest(new { Message = "Para dar por terminado un contrato, debe hacerlo desde la propiedad asociada. No puede marcar al cliente como perdido desde aquí." });
                    }
                }

                // 3. Lógica de Retención
                if (!esTipoPropietario && command.NuevoEstado == "Perdido")
                {
                    var tieneCierresActivos = await context.Properties
                        .AnyAsync(p => p.CerradoConId == id && (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada"), ct);
                    
                    if (tieneCierresActivos)
                    {
                        return Results.BadRequest(new { Message = "No puedes marcar como perdido a un cliente con propiedades cerradas activas. Anula la transacción de la propiedad primero." });
                    }

                    var tieneReservasActivas = await context.Properties
                        .AnyAsync(p => p.CerradoConId == id && p.EstadoComercial == "Reservada", ct);

                    if (tieneReservasActivas)
                    {
                        return Results.BadRequest(new { Message = "El cliente tiene reservas activas. Cancele la reserva desde el catálogo de propiedades antes de marcarlo como perdido." });
                    }
                }

                // --- SSoT: BULK UPDATES & DELETES (EF Core Optimizado) ---
                if (esTipoPropietario && command.NuevoEstado == "Inactivo")
                {
                    var tieneTransaccionesActivas = await context.Properties
                        .AnyAsync(p => p.PropietarioId == id && (p.EstadoComercial == "Reservada" || p.EstadoComercial == "Alquilada" || p.EstadoComercial == "Vendida"), ct);

                    if (tieneTransaccionesActivas)
                    {
                        return Results.BadRequest(new { Message = "El propietario tiene transacciones activas. Por favor, gestione estas transacciones desde el catálogo de propiedades para poder pasarlo a inactivo." });
                    }

                    // Query base para apuntar solo a las propiedades disponibles de este dueño
                    var propiedadesAfectadas = context.Properties
                        .Where(p => p.PropietarioId == id && p.EstadoComercial == "Disponible");

                    // 1. Borrar masivamente toda la Media (Fotos, PDFs generados, documentos) asociados
                    await propiedadesAfectadas.SelectMany(p => p.Media).ExecuteDeleteAsync(ct);
                    
                    // 2. Borrar masivamente las carpetas lógicas de las galerías (si aplica)
                    await propiedadesAfectadas.SelectMany(p => p.GallerySections).ExecuteDeleteAsync(ct);

                    // 3. Cambiar masivamente el estado de la propiedad a Inactiva
                    await propiedadesAfectadas.ExecuteUpdateAsync(s => s.SetProperty(p => p.EstadoComercial, "Inactiva"), ct);
                }
                else if (esTipoPropietario && contacto.EstadoPropietario == "Inactivo" && command.NuevoEstado == "Activo")
                {
                    // Cambiar masivamente el estado de regreso a Disponible
                    await context.Properties
                        .Where(p => p.PropietarioId == id && p.EstadoComercial == "Inactiva")
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.EstadoComercial, "Disponible"), ct);
                }

                // Actualizar etapa del contacto
                if (esTipoPropietario)
                {
                    contacto.EstadoPropietario = command.NuevoEstado;
                }
                else
                {
                    var oldState = contacto.EstadoEmbudo;
                    contacto.EstadoEmbudo = command.NuevoEstado;

                    if ((oldState == "Cerrado" || oldState == "Cerrado Ganado") && (command.NuevoEstado == "Nuevo" || command.NuevoEstado == "Contactado"))
                    {
                        var interaccion = new Interaction
                        {
                            AgenteId = agenteId,
                            ContactoId = id,
                            TipoInteraccion = "Sistema",
                            Notas = $"Inicia nuevo ciclo comercial. El cliente pasó de Cerrado a {command.NuevoEstado}.",
                            FechaInteraccion = DateTimeOffset.UtcNow
                        };
                        context.Interactions.Add(interaccion);
                    }
                }

                // Crear tarea automática
                if (command.NuevoEstado == "Cita")
                {
                    var task = new TaskItem
                    {
                        Id = Guid.NewGuid(),
                        AgenteId = agenteId,
                        ContactoId = id,
                        Titulo = $"Visita Programada: {contacto.Nombre} {contacto.Apellido}",
                        TipoTarea = "Visita",
                        FechaInicio = DateTimeOffset.UtcNow.AddDays(1),
                        DuracionMinutos = 60,
                        Estado = "Pendiente"
                    };
                    context.Tasks.Add(task);
                }
                
                await context.SaveChangesAsync(ct);
                await context.UpsertAgentContactActivityAsync(agenteId, id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);

                // Limpiar caché
                await cacheStore.EvictByTagAsync("dashboard-data", ct);
                await cacheStore.EvictByTagAsync("analytics-data", ct);
                warmingService.NotifyChange(agenteId);

                return Results.NoContent();
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error al cambiar etapa de contacto {Id}", id);
                return Results.Problem("Error interno al procesar el cambio de etapa.");
            }
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("CambiarEstadoContacto");
    }
}