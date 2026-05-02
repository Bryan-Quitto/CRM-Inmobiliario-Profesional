using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Catálogo central de inmuebles.
/// </summary>
public sealed class Property
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Titulo { get; set; } = string.Empty;

    [Required]
    public string Descripcion { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string TipoPropiedad { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Operacion { get; set; } = string.Empty;

    public decimal Precio { get; set; }

    public decimal? PrecioCierre { get; set; }

    [Required]
    [MaxLength(255)]
    public string Direccion { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Sector { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Ciudad { get; set; } = string.Empty;

    public string? GoogleMapsUrl { get; set; }

    [MaxLength(1000)]
    public string? UrlRemax { get; set; }

    public int Habitaciones { get; set; }

    public decimal Banos { get; set; }

    public decimal AreaTotal { get; set; }

    public decimal? AreaTerreno { get; set; }

    public decimal? AreaConstruccion { get; set; }

    public int? Estacionamientos { get; set; }

    public int? MediosBanos { get; set; }

    public int? AniosAntiguedad { get; set; }

    [Required]
    [MaxLength(50)]
    public string EstadoComercial { get; set; } = "Disponible";

    [Required]
    public bool EsCaptacionPropia { get; set; } = true;

    [Required]
    public decimal PorcentajeComision { get; set; } = 5.0m;

    [Required]
    public Guid AgenteId { get; set; }
    public Agent? Agente { get; set; }

    public Guid? AgenciaId { get; set; }
    public Agency? Agencia { get; set; }

    public Guid? PropietarioId { get; set; }
    public Contacto? Propietario { get; set; }

    public Guid? CerradoConId { get; set; }
    public Contacto? CerradoCon { get; set; }

    public DateTimeOffset FechaIngreso { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? FechaCierre { get; set; }

    // Relaciones de navegación
    public ICollection<PropertyGallerySection> GallerySections { get; set; } = new List<PropertyGallerySection>();
    public ICollection<PropertyMedia> Media { get; set; } = new List<PropertyMedia>();
    public ICollection<ContactoInteresPropiedad> ContactInterests { get; set; } = new List<ContactoInteresPropiedad>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
    public ICollection<PropertyTransaction> Transactions { get; set; } = new List<PropertyTransaction>();
}
