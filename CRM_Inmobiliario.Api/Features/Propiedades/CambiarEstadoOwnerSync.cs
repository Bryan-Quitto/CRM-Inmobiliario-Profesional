using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoOwnerSync
{
    public static async Task SincronizarPropietarioAsync(
        Property property,
        string nuevoEstado,
        CrmDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
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
}
