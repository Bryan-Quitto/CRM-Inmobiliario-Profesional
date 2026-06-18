using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Pregunta frecuente asociada a una propiedad, con ciclo de vida editorial.
/// </summary>
public sealed class PropertyFaq
{
    public Guid Id { get; set; }

    [Required]
    public Guid PropiedadId { get; set; }
    public Property Propiedad { get; set; } = null!;

    [Required]
    public string Pregunta { get; set; } = string.Empty;

    [Required]
    public string Respuesta { get; set; } = string.Empty;

    // Estados válidos: Borrador | EnRevision | Aprobada | Rechazada | Desactivada
    [Required]
    [MaxLength(20)]
    public string Estado { get; set; } = "Borrador";

    [Required]
    public Guid CreadoPorAgenteId { get; set; }
    public Agent CreadoPorAgente { get; set; } = null!;

    public string? NotaRechazo { get; set; }

    public DateTimeOffset FechaCreacion { get; set; }
    public DateTimeOffset FechaActualizacion { get; set; }
}
