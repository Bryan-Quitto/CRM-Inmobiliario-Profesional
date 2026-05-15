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
            .Include(p => p.Agente)
            .Include(p => p.Transactions.Where(t => t.TransactionStatus == "Active"))
                .ThenInclude(t => t.CreatedBy)
            .FirstOrDefaultAsync(p => p.Id == propertyId && 
                (p.AgenteId == currentUserId || 
                 p.CreatedByAgenteId == currentUserId || 
                 (currentUserAgenciaId != null && p.AgenciaId == currentUserAgenciaId) ||
                 p.Transactions.Any(t => t.CreatedById == currentUserId)), ct);

        if (property == null)
        {
            logger.LogWarning("⚠️ [VALIDATOR] Propiedad {Id} no encontrada para el agente {AgenteId}", propertyId, currentUserId);
            return new ValidationResult(false, "La propiedad no existe o no tiene permisos de visibilidad.", StatusCodes.Status404NotFound);
        }

        // 2. SEGURIDAD: Guardián de Estados (Multi-Agente)
        // Lógica de Dueño/Gestor según EsCaptadorActivo
        bool esDuenioGestor = (property.EsCaptadorActivo && property.AgenteId == currentUserId) || 
                             (!property.EsCaptadorActivo && property.CreatedByAgenteId == currentUserId);

        // Regla ESTRICTA: Solo el dueño/gestor puede cambiar estados. 
        // El autor de la transacción ya no tiene este permiso (Spec 015 Update).
        if (!esDuenioGestor)
        {
            var autorId = property.EsCaptadorActivo ? property.AgenteId : property.CreatedByAgenteId;
            var autorNombre = property.EsCaptadorActivo 
                ? (property.Agente != null ? $"{property.Agente.Nombre} {property.Agente.Apellido}" : "el agente captador")
                : "el agente que registró la propiedad";

            string msg = property.EstadoComercial == "Disponible"
                ? (property.EsCaptadorActivo 
                    ? $"Solo el agente captador ({autorNombre}) puede modificar los estados."
                    : $"Solo el agente ({autorNombre}) que registró la propiedad puede modificar los estados.")
                : $"Esta propiedad está siendo gestionada por {autorNombre}. Contáctese con dicho agente para cualquier cambio de estado.";

            return new ValidationResult(false, msg, StatusCodes.Status400BadRequest);
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
