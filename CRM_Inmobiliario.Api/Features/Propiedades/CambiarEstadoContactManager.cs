using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoContactManager
{
    public static async Task RevertirContactoAsync(
        Property property,
        bool esCierreOReserva,
        CrmDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
        if (!esCierreOReserva && property.CerradoConId.HasValue)
        {
            logger.LogInformation("🔍 [REVERT] Iniciando reversión para propiedad {PropId}. Contacto anterior ID: {ContactoId}", property.Id, property.CerradoConId.Value);
            var contactoToRevert = await context.Contactos.FirstOrDefaultAsync(l => l.Id == property.CerradoConId.Value, ct);
            if (contactoToRevert != null)
            {
                logger.LogInformation("🔍 [REVERT] Contacto encontrado: {Nombre}. Estado actual: {Estado}", contactoToRevert.Nombre, contactoToRevert.EstadoEmbudo);
                // Verificar si tiene otras propiedades con cierres firmes (Vendida o Alquilada)
                bool tieneOtrasCerradas = await context.Properties.AnyAsync(p => 
                    p.CerradoConId == contactoToRevert.Id && 
                    p.Id != property.Id && 
                    (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada"), ct);

                if (tieneOtrasCerradas)
                {
                    logger.LogInformation("🛡️ [REVERT] Contacto {Nombre} retiene estado de Cierre porque tiene otras transacciones activas.", contactoToRevert.Nombre);
                    contactoToRevert.EstadoEmbudo = "Cerrado"; // Restaurar a Cerrado explícitamente
                }
                else
                {
                    // Verificar si tiene otras reservas activas
                    bool tieneOtrasReservadas = await context.Properties.AnyAsync(p => 
                        p.CerradoConId == contactoToRevert.Id && 
                        p.Id != property.Id && 
                        p.EstadoComercial == "Reservada", ct);

                    logger.LogInformation("🔍 [REVERT] ¿Tiene otras reservadas? {Respuesta}", tieneOtrasReservadas);

                    if (tieneOtrasReservadas)
                    {
                        logger.LogInformation("🤝 [REVERT] Contacto {Nombre} retiene estado de Negociación por otras reservas activas.", contactoToRevert.Nombre);
                        contactoToRevert.EstadoEmbudo = "En Negociación";
                        contactoToRevert.FechaCierre = null;
                    }
                    else
                    {
                        logger.LogInformation("⚠️ [REVERT] Contacto {Nombre} no tiene nada más. Degradando a Perdido. EstadoPropiedadAnterior: {EstadoProp}", contactoToRevert.Nombre, property.EstadoComercial);
                        // No tiene nada más, pasa a Perdido (Trato Caído)
                        if (property.EstadoComercial == "Reservada")
                        {
                            contactoToRevert.EstadoEmbudo = "Perdido";
                        }
                        else
                        {
                            contactoToRevert.EstadoEmbudo = "Perdido";
                        }
                        contactoToRevert.FechaCierre = null;
                        
                        logger.LogInformation("✅ [REVERT] Estado embudo asignado: {NuevoEstado}", contactoToRevert.EstadoEmbudo);
                    }
                }
            }
            else
            {
                logger.LogWarning("❌ [REVERT] No se encontró el contacto en la BD con ID: {ContactoId}", property.CerradoConId.Value);
            }
        }
        else
        {
            logger.LogInformation("⏭️ [REVERT_DEBUG] Saltando reversión. esCierreOReserva: {Bool1}, property.CerradoConId.HasValue: {Bool2}", esCierreOReserva, property.CerradoConId.HasValue);
        }
    }

    public static async Task AsegurarInteresAsync(
        Property property,
        Contacto? contacto,
        bool esCierreOReserva,
        DateTimeOffset ecuadorNow,
        CrmDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
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
    }
}
