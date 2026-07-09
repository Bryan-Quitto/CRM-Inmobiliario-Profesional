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
        decimal? montoReserva,
        Guid? cerradoConId,
        Guid? agenteCerradorId,
        Guid currentUserId,
        CrmDbContext context,
        ILogger logger,
        CancellationToken ct)
    {
        var ecuadorNow = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
        var esCierre = nuevoEstado is "Vendida" or "Alquilada";
        var esReserva = nuevoEstado == "Reservada";
        var esCierreOReserva = esCierre || esReserva;

        if (esCierre && property.EstadoComercial != "Reservada")
        {
            throw new InvalidOperationException("La propiedad debe estar en estado Reservada antes de ser Vendida o Alquilada.");
        }

        // 2. Relistado automático por transición desde un estado cerrado/reservado hacia Disponible
        bool requiereRelistadoAutomatico = property.CerradoConId.HasValue && nuevoEstado == "Disponible";

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

        CambiarEstadoTransactionManager.ProcesarRelistadoOFinalizarTransacciones(
            property, requiereRelistadoAutomatico, esCierre, currentUserId, ecuadorNow, context, logger);

        // 3. Revertir Contacto si ya no es un cierre ni reserva (ej. pasa de Reservada a Disponible)
        await CambiarEstadoContactManager.RevertirContactoAsync(
            property, esCierreOReserva, context, logger, ct);

        // 4. Actualizar Propiedad
        property.EstadoComercial = nuevoEstado;
        property.FechaCierre = esCierre ? ecuadorNow : null;
        property.PrecioCierre = esCierre ? (precioCierre ?? property.PrecioCierre) : (esReserva ? precioCierre : null);
        property.PrecioReserva = esCierre ? property.PrecioReserva : (esReserva ? montoReserva : null);
        property.CerradoConId = esCierreOReserva ? cerradoConId : null;
        property.AgenteCerradorId = esCierreOReserva ? agenteCerradorId : null;
        property.FechaArchivado = nuevoEstado == "Archivado" ? ecuadorNow : null;

        // 4.1. Asegurar Interés
        await CambiarEstadoContactManager.AsegurarInteresAsync(
            property, contacto, esCierreOReserva, ecuadorNow, context, logger, ct);

        // 4.5. Registrar Reserva
        CambiarEstadoTransactionManager.RegistrarReserva(
            property, contacto, esReserva, montoReserva, currentUserId, ecuadorNow, context, logger);

        // 5. Registrar Cierre (Contacto + Transacción + Interacción)
        CambiarEstadoTransactionManager.RegistrarCierre(
            property, contacto, esCierre, nuevoEstado, precioCierre, currentUserId, ecuadorNow, context, logger);

        // 6. Sincronización de Estado del Propietario (Spec 015 & Fix Prueba 3/4)
        await CambiarEstadoOwnerSync.SincronizarPropietarioAsync(
            property, nuevoEstado, context, logger, ct);
    }
}
