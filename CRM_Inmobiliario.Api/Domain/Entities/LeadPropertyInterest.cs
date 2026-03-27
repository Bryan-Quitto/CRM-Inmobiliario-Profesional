using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Tabla puente para rastrear qué opciones se le han presentado a un lead.
/// </summary>
public sealed class LeadPropertyInterest
{
    public Guid ClienteId { get; set; }
    public Lead? Cliente { get; set; }

    public Guid PropiedadId { get; set; }
    public Property? Propiedad { get; set; }

    [Required]
    [MaxLength(50)]
    public string NivelInteres { get; set; } = "Medio";

    public DateTimeOffset FechaRegistro { get; set; } = DateTimeOffset.UtcNow;
}
