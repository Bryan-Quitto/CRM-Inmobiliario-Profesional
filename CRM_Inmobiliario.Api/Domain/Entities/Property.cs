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

    public int Habitaciones { get; set; }

    public decimal Banos { get; set; }

    public decimal AreaTotal { get; set; }

    [Required]
    [MaxLength(50)]
    public string EstadoComercial { get; set; } = "Disponible";

    public Guid AgenteId { get; set; }
    public Agent? Agente { get; set; }

    public Guid PropietarioId { get; set; }
    public Lead? Propietario { get; set; }

    public DateTimeOffset FechaIngreso { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? FechaCierre { get; set; }

    // Relaciones de navegación
    public ICollection<PropertyMedia> Media { get; set; } = new List<PropertyMedia>();
    public ICollection<LeadPropertyInterest> LeadInterests { get; set; } = new List<LeadPropertyInterest>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
}
