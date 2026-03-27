using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Soporte para fotos, videos y tours 360°, optimizado para Object Storage.
/// </summary>
public sealed class PropertyMedia
{
    public Guid Id { get; set; }

    public Guid PropiedadId { get; set; }
    public Property? Propiedad { get; set; }

    [Required]
    [MaxLength(50)]
    public string TipoMultimedia { get; set; } = string.Empty;

    [Required]
    public string UrlPublica { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? StoragePath { get; set; }

    public bool EsPrincipal { get; set; }

    public int Orden { get; set; }
}
