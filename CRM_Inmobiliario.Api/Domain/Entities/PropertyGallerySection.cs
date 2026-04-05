using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Permite agrupar multimedia por secciones (ej: "Baños", "Cocina").
/// </summary>
public sealed class PropertyGallerySection
{
    public Guid Id { get; set; }

    public Guid PropiedadId { get; set; }
    public Property? Propiedad { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? Descripcion { get; set; }

    public int Orden { get; set; }

    public DateTimeOffset FechaCreacion { get; set; } = DateTimeOffset.UtcNow;

    // Relaciones de navegación
    public ICollection<PropertyMedia> Media { get; set; } = new List<PropertyMedia>();
}
