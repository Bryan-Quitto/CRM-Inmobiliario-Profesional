using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoProcessor
{
    public static async Task ProcessAsync(
        Property property,
        string nuevoEstado,
        decimal? precioCierre,
        Guid? cerradoConId,
        Guid currentUserId,
        CrmDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
        var ecuadorNow = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
        var esCierre = nuevoEstado is "Vendida" or "Alquilada" or "Vendido" or "Rentado";
        var esReserva = nuevoEstado == "Reservada";
        var esCierreOReserva = esCierre || esReserva;
        
        // 1. Soporte para Alquileres Sucesivos Automáticos (Fase 5 item 3)
        bool esAlquilerSucesivo = property.EstadoComercial == "Alquilada" 
                                  && nuevoEstado == "Alquilada" 
                                  && cerradoConId.HasValue 
                                  && cerradoConId != property.CerradoConId;

        // 2. Spec 011 Fase 5 item 3: Relistado automático por transición entre estados de cierre
        bool requiereRelistadoAutomatico = property.CerradoConId.HasValue && esCierre && !esAlquilerSucesivo;

        Contacto? contacto = null;
        if (esCierreOReserva && cerradoConId.HasValue)
        {
            logger.LogInformation("👤 [PROCESSOR] Buscando Contacto asociado: {ContactoId}", cerradoConId.Value);
            
            // Permitir contacto si es el dueño O si tiene visibilidad compartida (Spec 017)
            contacto = await context.Contactos
                .Include(c => c.CompartidoCon)
                .FirstOrDefaultAsync(c => c.Id == cerradoConId.Value 
                    && (c.AgenteId == currentUserId || c.CompartidoCon.Any(ac => ac.AgenteId == currentUserId)), ct);
            
            if (contacto == null)
            {
                logger.LogWarning("⚠️ [PROCESSOR] No se encontró el contacto {ContactoId} o el agente {AgenteId} no tiene permisos de visibilidad sobre él.", cerradoConId.Value, currentUserId);
            }
        }

        if (requiereRelistadoAutomatico)
        {
            logger.LogInformation("🔄 [PROCESSOR] Relistado automático detectado.");
            FinalizarTransaccionesActivas(property);

            context.PropertyTransactions.Add(new PropertyTransaction
            {
                Id = Guid.NewGuid(),
                PropertyId = property.Id,
                TransactionType = "Relisting",
                TransactionStatus = "Completed",
                TransactionDate = ecuadorNow.AddTicks(-1),
                Notes = "Relistado automático por transición de estado comercial.",
                CreatedById = currentUserId
            });
        }
        else if (property.Transactions.Any(t => t.TransactionStatus == "Active"))
        {
            // Si es un cambio de estado comercial (de cierre a disponible/otro), marcamos como Completed
            if (!esCierre || esAlquilerSucesivo)
            {
                FinalizarTransaccionesActivas(property);
            }
        }

        // 3. Revertir Contacto si ya no es un cierre ni reserva (ej. pasa de Reservada a Disponible)
        if (!esCierreOReserva && property.CerradoConId.HasValue)
        {
            var contactoToRevert = await context.Contactos.FirstOrDefaultAsync(l => l.Id == property.CerradoConId.Value, ct);
            if (contactoToRevert != null)
            {
                // Verificar si tiene otras propiedades con cierres firmes (Vendida o Alquilada)
                bool tieneOtrasCerradas = await context.Properties.AnyAsync(p => 
                    p.CerradoConId == contactoToRevert.Id && 
                    p.Id != property.Id && 
                    (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada" || p.EstadoComercial == "Vendido" || p.EstadoComercial == "Rentado"), ct);

                if (tieneOtrasCerradas)
                {
                    logger.LogInformation("🛡️ [PROCESSOR] Contacto {Nombre} retiene estado de Cierre porque tiene otras transacciones activas.", contactoToRevert.Nombre);
                }
                else
                {
                    // Verificar si tiene otras reservas activas
                    bool tieneOtrasReservadas = await context.Properties.AnyAsync(p => 
                        p.CerradoConId == contactoToRevert.Id && 
                        p.Id != property.Id && 
                        p.EstadoComercial == "Reservada", ct);

                    if (tieneOtrasReservadas)
                    {
                        logger.LogInformation("🤝 [PROCESSOR] Contacto {Nombre} retiene estado de Negociación por otras reservas activas.", contactoToRevert.Nombre);
                        contactoToRevert.EtapaEmbudo = "En Negociación";
                        contactoToRevert.FechaCierre = null;
                    }
                    else
                    {
                        // No tiene nada más, downgrade completo
                        if (property.EstadoComercial == "Reservada")
                        {
                            // Si se cae una reserva, el contacto pasa a Perdido
                            contactoToRevert.EtapaEmbudo = "Perdido";
                        }
                        else
                        {
                            // Si se cae un cierre y no tiene nada más, vuelve a negociación
                            contactoToRevert.EtapaEmbudo = "En Negociación";
                        }
                        contactoToRevert.FechaCierre = null;
                    }
                }
            }
        }

        // 4. Actualizar Propiedad
        property.EstadoComercial = nuevoEstado;
        property.FechaCierre = esCierre ? ecuadorNow : null;
        property.PrecioCierre = esCierre ? precioCierre : null;
        property.PrecioReserva = esReserva ? precioCierre : null;
        property.CerradoConId = esCierreOReserva ? cerradoConId : null;

        // 4.1. Asegurar Interés
        if (esCierreOReserva && contacto != null)
        {
            var interesExistente = await context.Set<ContactoInteresPropiedad>()
                .FirstOrDefaultAsync(i => i.ContactoId == contacto.Id && i.PropiedadId == property.Id, ct);

            if (interesExistente == null)
            {
                logger.LogInformation("🔗 [PROCESSOR] Creando relación de Interés para la propiedad {PropiedadId} y contacto {ContactoId}.", property.Id, contacto.Id);
                context.Set<ContactoInteresPropiedad>().Add(new ContactoInteresPropiedad
                {
                    ContactoId = contacto.Id,
                    PropiedadId = property.Id,
                    NivelInteres = "Alto",
                    FechaRegistro = ecuadorNow
                });
            }
            else if (interesExistente.NivelInteres != "Alto")
            {
                interesExistente.NivelInteres = "Alto";
            }
        }

        // 4.5. Registrar Reserva
        if (esReserva && contacto != null)
        {
            contacto.EtapaEmbudo = "En Negociación";
            logger.LogInformation("🤝 [PROCESSOR] Propiedad {Titulo} Reservada. Contacto {Nombre} pasó a En Negociación.", property.Titulo, contacto.Nombre);

            string reservaTexto = (precioCierre.HasValue && precioCierre.Value > 0)
                ? $"por un monto de reserva de {precioCierre.Value:C}"
                : "de palabra";

            context.Interactions.Add(new Interaction
            {
                AgenteId = currentUserId,
                ContactoId = contacto.Id,
                PropiedadId = property.Id,
                TipoInteraccion = "Reserva",
                Notas = $"Propiedad '{property.Titulo}' marcada como Reservada {reservaTexto}."
            });

            context.PropertyTransactions.Add(new PropertyTransaction
            {
                Id = Guid.NewGuid(),
                PropertyId = property.Id,
                ContactoId = contacto.Id,
                TransactionType = "Reservation",
                TransactionStatus = "Completed",
                Amount = precioCierre,
                TransactionDate = ecuadorNow,
                CreatedById = currentUserId,
                Notes = $"Propiedad reservada {reservaTexto}."
            });
        }

        // 5. Registrar Cierre (Contacto + Transacción + Interacción)
        if (esCierre && contacto != null)
        {
            contacto.EtapaEmbudo = "Cerrado";
            contacto.FechaCierre = ecuadorNow;

            var tipoTransaccion = nuevoEstado == "Alquilada" ? "Rent" : "Sale";

            logger.LogInformation("📄 [PROCESSOR] Creando registro de transacción PropertyTransaction tipo {Tipo}...", tipoTransaccion);
            context.PropertyTransactions.Add(new PropertyTransaction
            {
                Id = Guid.NewGuid(),
                PropertyId = property.Id,
                ContactoId = contacto.Id,
                TransactionType = tipoTransaccion,
                TransactionStatus = "Active",
                Amount = precioCierre ?? property.Precio,
                TransactionDate = ecuadorNow,
                CreatedById = currentUserId,
                Notes = esAlquilerSucesivo 
                    ? $"Alquiler sucesivo registrado. El inquilino anterior finalizó su ciclo."
                    : $"Cierre realizado desde el detalle de la propiedad. Marcada como {nuevoEstado}."
            });

            context.Interactions.Add(new Interaction
            {
                AgenteId = currentUserId,
                ContactoId = contacto.Id,
                PropiedadId = property.Id,
                TipoInteraccion = "Cierre",
                Notas = $"Propiedad '{property.Titulo}' marcada como {nuevoEstado} por {precioCierre:C}."
            });
        }

        // 6. Sincronización de Estado del Propietario (Spec 015 & Fix Prueba 3/4)
        if (property.PropietarioId.HasValue)
        {
            logger.LogInformation("👤 [PROCESSOR] Sincronizando estado del Propietario ID: {PropietarioId}", property.PropietarioId.Value);
            
            // Intentar obtener el propietario con sus propiedades para la lógica de conteo
            var propietario = await context.Contactos
                .Include(c => c.PropertiesOwned)
                .FirstOrDefaultAsync(c => c.Id == property.PropietarioId.Value, ct);

            if (propietario != null)
            {
                string estadoAnterior = propietario.EstadoPropietario;
                bool esEstadoCierreOInactiva = nuevoEstado is "Vendida" or "Alquilada" or "Inactiva";
                
                if (esEstadoCierreOInactiva)
                {
                    // Si estamos cerrando o inactivando, verificamos si le quedan otras propiedades ACTIVAS (no cerradas ni inactivas)
                    bool tieneOtrasActivas = propietario.PropertiesOwned
                        .Any(p => p.Id != property.Id && p.EstadoComercial != "Vendida" && p.EstadoComercial != "Alquilada" && p.EstadoComercial != "Inactiva");

                    if (!tieneOtrasActivas)
                    {
                        logger.LogInformation("🏁 [PROCESSOR] El propietario {Nombre} no tiene otras propiedades activas. Cambiando: {Old} -> Cerrado", propietario.Nombre, estadoAnterior);
                        propietario.EstadoPropietario = "Cerrado";
                    }
                    else 
                    {
                        logger.LogInformation("🏠 [PROCESSOR] El propietario {Nombre} aún tiene otras propiedades activas.", propietario.Nombre);
                    }
                }
                else
                {
                    // Si la propiedad vuelve a estar disponible, reservada, etc., el dueño debe estar Activo
                    if (propietario.EstadoPropietario != "Activo")
                    {
                        logger.LogInformation("📈 [PROCESSOR] Reactivando propietario {Nombre}: {Old} -> Activo", propietario.Nombre, estadoAnterior);
                        propietario.EstadoPropietario = "Activo";
                    }
                }

                // Forzar el marcado de la entidad como modificada si hubo cambio
                if (estadoAnterior != propietario.EstadoPropietario)
                {
                    context.Entry(propietario).State = EntityState.Modified;
                }
            }
            else
            {
                logger.LogWarning("⚠️ [PROCESSOR] No se encontró el contacto Propietario con ID {Id}", property.PropietarioId.Value);
            }
        }
    }

    private static void FinalizarTransaccionesActivas(Property property)
    {
        foreach (var t in property.Transactions.Where(t => t.TransactionStatus == "Active"))
        {
            t.TransactionStatus = "Completed";
        }
    }
}
