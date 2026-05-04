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
        var esCierre = nuevoEstado is "Vendida" or "Alquilada";
        
        // 1. Soporte para Alquileres Sucesivos Automáticos (Fase 5 item 3)
        bool esAlquilerSucesivo = property.EstadoComercial == "Alquilada" 
                                  && nuevoEstado == "Alquilada" 
                                  && cerradoConId.HasValue 
                                  && cerradoConId != property.CerradoConId;

        // 2. Spec 011 Fase 5 item 3: Relistado automático por transición entre estados de cierre
        bool requiereRelistadoAutomatico = property.CerradoConId.HasValue && esCierre && !esAlquilerSucesivo;

        Contacto? contacto = null;
        if (esCierre && cerradoConId.HasValue)
        {
            logger.LogInformation("👤 [PROCESSOR] Buscando Contacto asociado: {ContactoId}", cerradoConId.Value);
            contacto = await context.Contactos
                .FirstOrDefaultAsync(l => l.Id == cerradoConId.Value && l.AgenteId == currentUserId, ct);
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

        // 3. Revertir Contacto si ya no es un cierre
        if (!esCierre && property.CerradoConId.HasValue)
        {
            var contactoToRevert = await context.Contactos.FirstOrDefaultAsync(l => l.Id == property.CerradoConId.Value, ct);
            if (contactoToRevert != null)
            {
                contactoToRevert.EtapaEmbudo = "En Negociación";
                contactoToRevert.FechaCierre = null;
            }
        }

        // 4. Actualizar Propiedad
        property.EstadoComercial = nuevoEstado;
        property.FechaCierre = esCierre ? ecuadorNow : null;
        property.PrecioCierre = esCierre ? precioCierre : null;
        property.CerradoConId = esCierre ? cerradoConId : null;

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
                
                if (esCierre)
                {
                    // Si estamos cerrando, verificamos si le quedan otras propiedades ACTIVAS (no cerradas)
                    // Nota: 'property' ya tiene el nuevo estado 'nuevoEstado' (Vendida/Alquilada) aplicado en el paso 4
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
                else if (nuevoEstado != "Inactiva")
                {
                    // Si la propiedad vuelve a estar disponible, el dueño debe estar Activo
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
