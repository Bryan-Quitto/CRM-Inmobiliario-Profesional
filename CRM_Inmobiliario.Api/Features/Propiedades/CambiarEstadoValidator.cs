using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class CambiarEstadoValidator
{
    public record ValidationResult(bool Success, string Message = "", int StatusCode = 200, Property? Property = null);

    public static async Task<ValidationResult> ValidateAsync(
        Guid propertyId, 
        Guid currentUserId, 
        string nuevoEstado,
        CrmDbContext context, 
        ILogger logger,
        CancellationToken ct)
    {
        // 1. Validar visibilidad multi-tenant (Agente vs Agencia)
        var currentUserAgenciaId = await context.Agents
            .AsNoTracking()
            .Where(a => a.Id == currentUserId)
            .Select(a => a.AgenciaId)
            .FirstOrDefaultAsync(ct);

        var property = await context.Properties
            .Include(p => p.Transactions.Where(t => t.TransactionStatus == "Active"))
                .ThenInclude(t => t.CreatedBy)
            .FirstOrDefaultAsync(p => p.Id == propertyId && (p.AgenteId == currentUserId || (currentUserAgenciaId != null && p.AgenciaId == currentUserAgenciaId)), ct);

        if (property == null)
        {
            logger.LogWarning("⚠️ [VALIDATOR] Propiedad {Id} no encontrada para el agente {AgenteId}", propertyId, currentUserId);
            return new ValidationResult(false, "La propiedad no existe o no tiene permisos de visibilidad.", StatusCodes.Status404NotFound);
        }

        // 2. SEGURIDAD: Guardián de Estados (Multi-Agente)
        var activeTransaction = property.Transactions.OrderByDescending(t => t.TransactionDate).FirstOrDefault(t => t.TransactionStatus == "Active");
        
        if (property.EstadoComercial is "Reservada" or "Vendida" or "Alquilada" && nuevoEstado is "Disponible" or "Inactiva")
        {
            bool esAutorTransaccion = activeTransaction != null && activeTransaction.CreatedById == currentUserId;
            bool esDuenioCaptacion = property.AgenteId == currentUserId;

            if (!esAutorTransaccion && !esDuenioCaptacion)
            {
                var responsable = activeTransaction?.CreatedBy != null 
                    ? $"{activeTransaction.CreatedBy.Nombre} {activeTransaction.CreatedBy.Apellido}"
                    : "otro agente";

                var msg = property.EstadoComercial switch
                {
                    "Reservada" => $"Esta propiedad está en proceso por el agente {responsable}. Contáctese con el agente si desea hacer alguna modificación.",
                    _ => $"Esta propiedad ya fue {property.EstadoComercial.ToLower()} por el agente {responsable}. Contáctese con el agente si desea hacer alguna modificación."
                };

                return new ValidationResult(false, msg, StatusCodes.Status400BadRequest);
            }
        }

        // 3. Spec 011: Validación de estado Reservada sobre Cierre
        if (nuevoEstado == "Reservada" && (property.EstadoComercial is "Vendida" or "Alquilada"))
        {
            logger.LogWarning("⚠️ [VALIDATOR] Intento de reservar propiedad ya cerrada {Id}", propertyId);
            return new ValidationResult(false, "No puedes reservar una propiedad que ya está vendida o alquilada. Primero debes marcarla como Disponible.", StatusCodes.Status400BadRequest);
        }

        return new ValidationResult(true, Property: property);
    }
}
