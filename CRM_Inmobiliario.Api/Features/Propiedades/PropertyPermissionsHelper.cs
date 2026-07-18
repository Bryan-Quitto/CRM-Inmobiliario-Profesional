using System;
using CRM_Inmobiliario.Api.Domain.Entities;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class PropertyPermissionsHelper
{
    /// <summary>
    /// Valida si el agente actual tiene permisos de gestión (Edición, Galería, Estados) sobre la propiedad
    /// basándose en la regla de delegación por Agente Activo.
    /// </summary>
    public static bool CanManage(Property property, Guid currentUserId, bool isArchivedForCurrentUser = false)
    {
        if (isArchivedForCurrentUser) return false;

        // Regla de Agentes Invitados: El creador mantiene acceso si el agente asignado es invitado (Activo = false).
        // Si el agente activa su cuenta (Activo = true), el creador pierde acceso y el nuevo agente toma control total.
        return property.AgenteId == currentUserId ||
               ((property.Transactions?.Any(t => t.CreatedById == currentUserId) == true) && (property.Agente == null || !property.Agente.Activo));
    }

    /// <summary>
    /// Valida si el agente actual es el gestor autorizado de las FAQs de la propiedad.
    /// Replica la regla de delegación de CanManage() aplicada al contexto de FAQs.
    /// </summary>
    public static bool CanManageFaq(Property property, Guid currentUserId, string currentUserRole, bool isArchivedForCurrentUser = false)
    {
        if (isArchivedForCurrentUser) return false;

        // El rol Autorizado (AgenteId de la propiedad si el captador está activo) puede aprobar/rechazar directamente.
        // Si el captador está inactivo, el creador de la transacción activa asume el control.
        var isDirectManager = property.AgenteId == currentUserId && (property.Agente == null || property.Agente.Activo);
        var isFallbackManager = !isDirectManager &&
                                (property.Transactions?.Any(t => t.CreatedById == currentUserId) == true) &&
                                (property.Agente == null || !property.Agente.Activo);

        return isDirectManager || isFallbackManager;
    }

    /// <summary>
    /// Verifica si la propiedad está bloqueada para subir imágenes o generar PDFs
    /// debido a que ha transcurrido más de 1 año desde su cierre (Venta/Alquiler).
    /// </summary>
    public static bool IsLockedByAntiquity(Property property)
    {
        return property.BloqueoAdministrativo ?? false;
    }
}
