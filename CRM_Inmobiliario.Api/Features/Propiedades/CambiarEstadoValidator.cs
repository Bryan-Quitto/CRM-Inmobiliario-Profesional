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
                 (currentUserAgenciaId != null && p.AgenciaId == currentUserAgenciaId) ||
                 (p.Transactions.Any(t => t.CreatedById == currentUserId) && (p.Agente == null || !p.Agente.Activo))), ct);

        if (property == null)
        {
            logger.LogWarning("⚠️ [VALIDATOR] Propiedad {Id} no encontrada para el agente {AgenteId}", propertyId, currentUserId);
            return new ValidationResult(false, "La propiedad no existe o no tiene permisos de visibilidad.", StatusCodes.Status404NotFound);
        }

        // 2. SEGURIDAD: Guardián de Estados (Multi-Agente)
        // Lógica de Dueño/Gestor según Regla de Agentes Invitados
        bool esDuenioGestor = property.AgenteId == currentUserId || 
                              (property.Transactions.Any(t => t.CreatedById == currentUserId) && (property.Agente == null || !property.Agente.Activo));

        var isArchived = await context.AgentArchivedProperties.AnyAsync(a => a.AgentId == currentUserId && a.PropiedadId == propertyId, ct);
        if (!PropertyPermissionsHelper.CanManage(property, currentUserId, isArchived))
        {
            var esCreador = property.Transactions.Any(t => t.CreatedById == currentUserId);
            var gestorActivo = property.Agente != null && property.Agente.Activo;
            string msg = "No tiene permisos para modificar los estados de esta propiedad.";
            
            if (isArchived)
                return new ValidationResult(false, "No puedes modificar el estado de una propiedad archivada.", StatusCodes.Status400BadRequest);
            else if (esCreador && gestorActivo)
                msg = "El agente invitado ha activado su cuenta y ahora tiene el control exclusivo de la propiedad.";
            
            return new ValidationResult(false, msg, StatusCodes.Status403Forbidden);
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
