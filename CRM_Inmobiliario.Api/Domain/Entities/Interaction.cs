using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Bitácora de seguimiento de comunicación.
/// </summary>
public sealed class Interaction
{
    public Guid Id { get; set; }

    public Guid AgenteId { get; set; }
    public Agent? Agente { get; set; }

    public Guid ClienteId { get; set; }
    public Lead? Cliente { get; set; }

    public Guid? PropiedadId { get; set; }
    public Property? Propiedad { get; set; }

    [Required]
    [MaxLength(50)]
    public string TipoInteraccion { get; set; } = string.Empty;

    [Required]
    public string Notas { get; set; } = string.Empty;

    public DateTimeOffset FechaInteraccion { get; set; } = DateTimeOffset.UtcNow;
}
