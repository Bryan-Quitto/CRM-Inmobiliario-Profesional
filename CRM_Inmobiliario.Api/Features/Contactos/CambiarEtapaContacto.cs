using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class CambiarEtapaContactoFeature
{
    public record Command(string NuevaEtapa, string Tipo, decimal? PrecioCierre = null, Guid? PropiedadId = null);

    public static void MapCambiarEtapaContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPatch("/contactos/{id:guid}/etapa", async (Guid id, Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, IKpiWarmingService warmingService, ILogger<CrmDbContext> logger, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var esTipoPropietario = string.Equals(command.Tipo, "Propietario", StringComparison.OrdinalIgnoreCase);
            
            logger.LogInformation("[CierreDebug] Iniciando cambio de etapa para contacto {Id} a '{Etapa}' (Tipo: {Tipo}).", id, command.NuevaEtapa, command.Tipo);

            // 1. Validar que la nueva etapa sea válida para el tipo
            var etapasValidas = esTipoPropietario
                ? new[] { "Activo", "Inactivo", "Retirado", "Cerrado" }
                : new[] { "Nuevo", "Contactado", "Cita", "Perdido" }; // Restricción estricta de SSoT

            if (!etapasValidas.Contains(command.NuevaEtapa))
            {
                return Results.BadRequest(new { Message = $"Etapa '{command.NuevaEtapa}' no válida para el tipo '{command.Tipo}' o prohibida de cambio manual." });
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
                    return Results.Forbid();
                }

                // 2. Bloqueos Estrictos de Negocio (SSoT en Propiedades)
                if (!esTipoPropietario)
                {
                    if (contacto.EtapaEmbudo == "En Negociación")
                    {
                        return Results.BadRequest(new { Message = "El cliente está en medio de una negociación. Cualquier cambio debe realizarse desde el catálogo de propiedades." });
                    }
                    if ((contacto.EtapaEmbudo == "Cerrado" || contacto.EtapaEmbudo == "Cerrado Ganado") && command.NuevaEtapa == "Perdido")
                    {
                        return Results.BadRequest(new { Message = "Para dar por terminado un contrato, debe hacerlo desde la propiedad asociada. No puede marcar al cliente como perdido desde aquí." });
                    }
                }

                // 3. Lógica de Case 10: Retención de Estado por Relaciones Canceladas
                if (!esTipoPropietario && command.NuevaEtapa == "Perdido")
                {
                    // Validar si tiene propiedades cerradas activamente
                    var tieneCierresActivos = await context.Properties
                        .AnyAsync(p => p.CerradoConId == id && (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada"), ct);
                    
                    if (tieneCierresActivos)
                    {
                        return Results.BadRequest(new { Message = "No puedes marcar como perdido a un cliente con propiedades cerradas activas. Anula la transacción de la propiedad primero." });
                    }

                    // Validar si tiene reservas activas
                    var tieneReservasActivas = await context.Properties
                        .AnyAsync(p => p.CerradoConId == id && p.EstadoComercial == "Reservada", ct);

                    if (tieneReservasActivas)
                    {
                        return Results.BadRequest(new { Message = "El cliente tiene reservas activas. Cancele la reserva desde el catálogo de inmuebles antes de marcarlo como perdido." });
                    }
                }

                if (esTipoPropietario && command.NuevaEtapa == "Inactivo")
                {
                    // Validar si tiene transacciones activas
                    var tieneTransaccionesActivas = await context.Properties
                        .AnyAsync(p => p.PropietarioId == id && (p.EstadoComercial == "Reservada" || p.EstadoComercial == "Alquilada" || p.EstadoComercial == "Vendida"), ct);

                    if (tieneTransaccionesActivas)
                    {
                        return Results.BadRequest(new { Message = "El propietario tiene transacciones activas. Por favor, gestione estas transacciones desde el catálogo de propiedades para poder pasarlo a inactivo." });
                    }

                    // Pasar propiedades Disponibles a Inactiva — bulk update directo en DB (patrón FusionarContactos)
                    await context.Database.ExecuteSqlRawAsync(
                        """
                        UPDATE "Properties"
                        SET "EstadoComercial" = 'Inactiva'
                        WHERE "PropietarioId" = {0} AND "EstadoComercial" = 'Disponible'
                        """,
                        id);

                }

                // Actualizar etapa según el tipo
                if (esTipoPropietario)
                {
                    contacto.EstadoPropietario = command.NuevaEtapa;
                }
                else
                {
                    var oldState = contacto.EtapaEmbudo;
                    contacto.EtapaEmbudo = command.NuevaEtapa;

                    if ((oldState == "Cerrado" || oldState == "Cerrado Ganado") && (command.NuevaEtapa == "Nuevo" || command.NuevaEtapa == "Contactado"))
                    {
                        var interaccion = new Interaction
                        {
                            AgenteId = agenteId,
                            ContactoId = id,
                            TipoInteraccion = "Sistema",
                            Notas = $"Inicia nuevo ciclo comercial. El cliente pasó de Cerrado a {command.NuevaEtapa}.",
                            FechaInteraccion = DateTimeOffset.UtcNow
                        };
                        context.Interactions.Add(interaccion);
                    }
                }

                // Crear tarea automática si es una Cita
                if (command.NuevaEtapa == "Cita")
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

                contacto.FechaUltimaActividad = DateTimeOffset.UtcNow;
                await context.SaveChangesAsync(ct);

                // Limpiar caché y precalentar KPIs
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
        .WithName("CambiarEtapaContacto");
    }
}
