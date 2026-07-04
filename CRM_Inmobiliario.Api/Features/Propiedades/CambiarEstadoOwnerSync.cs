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
                
                // Obtener todos los estados de las propiedades actuales, reemplazando el de la propiedad que está cambiando
                var estadosPropiedades = propietario.PropertiesOwned
                    .Where(p => p.Id != property.Id)
                    .Select(p => p.EstadoComercial)
                    .ToList();
                estadosPropiedades.Add(nuevoEstado);

                bool tieneActivas = estadosPropiedades.Any(e => e != "Vendida" && e != "Alquilada" && e != "Inactiva");
                bool todasVendidasOAlquiladas = estadosPropiedades.Count > 0 && estadosPropiedades.All(e => e == "Vendida" || e == "Alquilada");
                bool todasInactivas = estadosPropiedades.Count > 0 && estadosPropiedades.All(e => e == "Inactiva");
                
                if (todasVendidasOAlquiladas)
                {
                    if (propietario.EstadoPropietario != "Cerrado")
                    {
                        logger.LogInformation("🏁 [PROCESSOR] Todas las propiedades del propietario {Nombre} están vendidas o alquiladas. Cambiando: {Old} -> Cerrado", propietario.Nombre, estadoAnterior);
                        propietario.EstadoPropietario = "Cerrado";
                    }
                }
                else if (todasInactivas)
                {
                    if (propietario.EstadoPropietario != "Inactivo")
                    {
                        logger.LogInformation("📉 [PROCESSOR] Todas las propiedades de {Nombre} están inactivas. Cambiando: {Old} -> Inactivo", propietario.Nombre, estadoAnterior);
                        propietario.EstadoPropietario = "Inactivo";
                    }
                }
                else if (tieneActivas)
                {
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
