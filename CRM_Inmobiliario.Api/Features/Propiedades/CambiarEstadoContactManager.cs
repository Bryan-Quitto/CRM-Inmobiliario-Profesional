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
            var contactoToRevert = await context.Contactos.FirstOrDefaultAsync(l => l.Id == property.CerradoConId.Value, ct);
            if (contactoToRevert != null)
            {
                // Verificar si tiene otras propiedades con cierres firmes (Vendida o Alquilada)
                bool tieneOtrasCerradas = await context.Properties.AnyAsync(p => 
                    p.CerradoConId == contactoToRevert.Id && 
                    p.Id != property.Id && 
                    (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada"), ct);

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
                        contactoToRevert.EstadoEmbudo = "En Negociación";
                        contactoToRevert.FechaCierre = null;
                    }
                    else
                    {
                        // No tiene nada más, downgrade completo
                        if (property.EstadoComercial == "Reservada")
                        {
                            contactoToRevert.EstadoEmbudo = "Contactado";
                        }
                        else
                        {
                            contactoToRevert.EstadoEmbudo = "Contactado";
                        }
                        contactoToRevert.FechaCierre = null;
                    }
                }
            }
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
