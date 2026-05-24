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
                ? new[] { "Activo", "Inactivo", "Vendido", "Rentado", "Retirado", "Cerrado" }
                : new[] { "Nuevo", "Contactado", "Cita", "En Negociación", "Negociación", "Cerrado", "Cerrado Ganado", "Perdido", "Cerrado Perdido" };

            if (!etapasValidas.Contains(command.NuevaEtapa))
            {
                return Results.BadRequest(new { Message = $"Etapa '{command.NuevaEtapa}' no válida para el tipo '{command.Tipo}'." });
            }

            // Buscar contacto y actualizar etapa
            try
            {
                // Buscar contacto
                var contacto = await context.Contactos
                    .FirstOrDefaultAsync(l => l.Id == id && l.AgenteId == agenteId, ct);

                if (contacto == null)
                {
                    return Results.NotFound();
                }

                // 2. Lógica de Case 10: Retención de Estado por Relaciones Canceladas
                if (!esTipoPropietario && (command.NuevaEtapa == "Perdido" || command.NuevaEtapa == "Cerrado Perdido"))
                {
                    // Validar si tiene propiedades cerradas activamente
                    var tieneCierresActivos = await context.Properties
                        .AnyAsync(p => p.CerradoConId == id && (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada"), ct);
                    
                    if (tieneCierresActivos)
                    {
                        return Results.BadRequest(new { Message = "No puedes marcar como perdido a un cliente con propiedades cerradas activas. Anula la transacción de la propiedad primero." });
                    }
                }

                // 2.5 Contingencia de Reservas: Si cae la negociación
                if (!esTipoPropietario && (command.NuevaEtapa == "Nuevo" || command.NuevaEtapa == "Contactado" || command.NuevaEtapa == "Perdido" || command.NuevaEtapa == "Cerrado Perdido"))
                {
                    if (contacto.EtapaEmbudo == "En Negociación" || contacto.EtapaEmbudo == "Nuevo" || contacto.EtapaEmbudo == "Contactado")
                    {
                        var propiedadesReservadas = await context.Properties
                            .Where(p => p.CerradoConId == id && p.EstadoComercial == "Reservada")
                            .ToListAsync(ct);
                        
                        if (propiedadesReservadas.Count > 1)
                        {
                            return Results.BadRequest(new { Message = "No se puede cambiar el estado porque el cliente tiene más de 1 propiedad reservada. Realice el ajuste (Trato Caído) desde el catálogo de inmuebles para cada propiedad." });
                        }
                            
                        foreach (var prop in propiedadesReservadas)
                        {
                            prop.EstadoComercial = "Disponible";
                            prop.CerradoConId = null;
                            logger.LogInformation("↩️ [CONTACTO] Negociación cancelada (Trato Caído). Propiedad {PropiedadId} vuelve a Disponible.", prop.Id);

                            context.PropertyTransactions.Add(new PropertyTransaction
                            {
                                Id = Guid.NewGuid(),
                                PropertyId = prop.Id,
                                ContactoId = id,
                                TransactionType = "Cancellation",
                                TransactionStatus = "Completed",
                                TransactionDate = DateTimeOffset.UtcNow,
                                Notes = "Reserva caída. Operación anulada desde el perfil del contacto.",
                                CreatedById = agenteId
                            });

                            context.Interactions.Add(new Interaction
                            {
                                Id = Guid.NewGuid(),
                                AgenteId = agenteId,
                                ContactoId = id,
                                PropiedadId = prop.Id,
                                TipoInteraccion = "Cancelación",
                                Notas = $"Trato Caído por cambio de etapa. Reserva de la propiedad '{prop.Titulo}' liberada.",
                                FechaInteraccion = DateTimeOffset.UtcNow
                            });
                        }
                    }
                }

                // 2.6 Sincronización de Reservas: Contacto -> Propiedad
                if (!esTipoPropietario && command.NuevaEtapa == "En Negociación" && command.PropiedadId.HasValue)
                {
                    var propiedadAReservar = await context.Properties.FirstOrDefaultAsync(p => p.Id == command.PropiedadId.Value && (p.AgenteId == agenteId || p.PropietarioId != null), ct);
                    if (propiedadAReservar != null)
                    {
                        propiedadAReservar.EstadoComercial = "Reservada";
                        propiedadAReservar.CerradoConId = id;
                        
                        if (command.PrecioCierre.HasValue)
                        {
                            propiedadAReservar.PrecioReserva = command.PrecioCierre;
                        }

                        logger.LogInformation("🤝 [CONTACTO] Contacto {ContactoId} pasó a En Negociación. Propiedad {PropiedadId} reservada.", id, propiedadAReservar.Id);

                        var interesExistente = await context.Set<ContactoInteresPropiedad>()
                            .FirstOrDefaultAsync(i => i.ContactoId == id && i.PropiedadId == propiedadAReservar.Id, ct);
                        
                        if (interesExistente == null)
                        {
                            context.Set<ContactoInteresPropiedad>().Add(new ContactoInteresPropiedad
                            {
                                ContactoId = id,
                                PropiedadId = propiedadAReservar.Id,
                                NivelInteres = "Alto",
                                FechaRegistro = DateTimeOffset.UtcNow
                            });
                        }
                        else if (interesExistente.NivelInteres != "Alto")
                        {
                            interesExistente.NivelInteres = "Alto";
                        }

                        var reservaTexto = command.PrecioCierre.HasValue ? $"por {command.PrecioCierre:C}" : "";

                        context.Interactions.Add(new Interaction
                        {
                            Id = Guid.NewGuid(),
                            AgenteId = agenteId,
                            ContactoId = id,
                            PropiedadId = propiedadAReservar.Id,
                            TipoInteraccion = "Reserva",
                            Notas = $"Propiedad '{propiedadAReservar.Titulo}' marcada como Reservada {reservaTexto}.",
                            FechaInteraccion = DateTimeOffset.UtcNow
                        });

                        context.PropertyTransactions.Add(new PropertyTransaction
                        {
                            Id = Guid.NewGuid(),
                            PropertyId = propiedadAReservar.Id,
                            ContactoId = id,
                            TransactionType = "Reservation",
                            TransactionStatus = "Completed",
                            Amount = command.PrecioCierre,
                            TransactionDate = DateTimeOffset.UtcNow,
                            CreatedById = agenteId,
                            Notes = $"Propiedad reservada {reservaTexto} desde el perfil del contacto."
                        });
                    }
                }

                if (esTipoPropietario && command.NuevaEtapa == "Inactivo")
                {
                    // Pasar propiedades Disponibles y Reservadas a Inactiva
                    var propiedadesAInactivar = await context.Properties
                        .Where(p => p.PropietarioId == id && (p.EstadoComercial == "Disponible" || p.EstadoComercial == "Reservada"))
                        .ToListAsync(ct);

                    foreach (var p in propiedadesAInactivar)
                    {
                        p.EstadoComercial = "Inactiva";
                    }
                }

                // Actualizar etapa según el tipo
                if (esTipoPropietario)
                {
                    contacto.EstadoPropietario = command.NuevaEtapa;
                }
                else
                {
                    contacto.EtapaEmbudo = command.NuevaEtapa;
                    
                    if (command.NuevaEtapa == "En Negociación" || command.NuevaEtapa == "Cerrado" || command.NuevaEtapa == "Cerrado Ganado")
                    {
                        contacto.BotActivo = false;
                    }
                }

                // Lógica especial para cierres (Cerrado Ganado / Vendido / Rentado / Cerrado)
                var esCierreExitoso = new[] { "Cerrado", "Cerrado Ganado", "Vendido", "Rentado" }.Contains(command.NuevaEtapa);
                
                if (esCierreExitoso)
                {
                    contacto.FechaCierre = DateTimeOffset.UtcNow;

                    // Si se marca como Cerrado / Cerrado Ganado, registrar el cierre SOLO para la propiedad indicada
                    if (!esTipoPropietario && (command.NuevaEtapa == "Cerrado" || command.NuevaEtapa == "Cerrado Ganado"))
                    {
                        if (command.PropiedadId.HasValue)
                        {
                            var property = await context.Properties.FirstOrDefaultAsync(p => p.Id == command.PropiedadId.Value && p.EstadoComercial != "Vendida" && p.EstadoComercial != "Alquilada", ct);
                            if (property != null)
                            {
                                var estado = command.NuevaEtapa == "Rentado" ? "Alquilada" : "Vendida";
                                property.EstadoComercial = estado;
                                property.CerradoConId = id; // Asegurar vinculación firme

                                if (command.PrecioCierre.HasValue)
                                {
                                    property.PrecioCierre = command.PrecioCierre;
                                }

                                // Registrar transacción de cierre
                                var propTransaction = new PropertyTransaction
                                {
                                    Id = Guid.NewGuid(),
                                    PropertyId = property.Id,
                                    ContactoId = id,
                                    CreatedById = agenteId,
                                    TransactionType = command.NuevaEtapa == "Rentado" ? "Rent" : "Sale",
                                    Amount = command.PrecioCierre ?? property.Precio,
                                    TransactionDate = DateTimeOffset.UtcNow,
                                    Notes = $"Cierre realizado desde el perfil del contacto. Propiedad '{property.Titulo}' marcada como {estado}."
                                };
                                context.PropertyTransactions.Add(propTransaction);

                                // Registrar interacción
                                var interaction = new Interaction
                                {
                                    Id = Guid.NewGuid(),
                                    AgenteId = agenteId,
                                    ContactoId = id,
                                    PropiedadId = property.Id,
                                    TipoInteraccion = "Cierre",
                                    Notas = $"Cierre realizado desde el perfil del contacto. Propiedad '{property.Titulo}' marcada como {estado} por {command.PrecioCierre:C}."
                                };
                                context.Interactions.Add(interaction);
                            }
                        }
                        else
                        {
                            logger.LogWarning("⚠️ [CONTACTO] Intento de cierre de cliente {Id} sin especificar PropiedadId. No se generará transacción.", id);
                        }
                    }
                }
                else
                {
                    contacto.FechaCierre = null;
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
