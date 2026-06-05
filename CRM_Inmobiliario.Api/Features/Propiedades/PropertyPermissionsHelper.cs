using System;
using CRM_Inmobiliario.Api.Domain.Entities;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class PropertyPermissionsHelper
{
    /// <summary>
    /// Valida si el agente actual tiene permisos de gestión (Edición, Galería, Estados) sobre la propiedad
    /// basándose en la regla de delegación por Agente Activo.
    /// </summary>
    public static bool CanManage(Property property, Guid currentUserId)
    {
        // Regla de Agentes Invitados: El creador mantiene acceso si el agente asignado es invitado (Activo = false).
        // Si el agente activa su cuenta (Activo = true), el creador pierde acceso y el nuevo agente toma control total.
        return property.AgenteId == currentUserId ||
               ((property.Transactions?.Any(t => t.CreatedById == currentUserId) == true) && (property.Agente == null || !property.Agente.Activo));
    }
}
