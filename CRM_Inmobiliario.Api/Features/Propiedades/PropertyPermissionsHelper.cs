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
        // 1. Si el captador es activo: Solo el AgenteId puede gestionar.
        // 2. Si el captador no es activo: Solo el Creador (CreatedByAgenteId) puede gestionar.
        return (property.EsCaptadorActivo && property.AgenteId == currentUserId) ||
               (!property.EsCaptadorActivo && property.CreatedByAgenteId == currentUserId);
    }
}
