using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Gestión de prospectos (clientes potenciales o propietarios).
/// </summary>
public sealed class Lead
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Apellido { get; set; }

    [MaxLength(255)]
    [EmailAddress]
    public string? Email { get; set; }

    [Required]
    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Origen { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string EtapaEmbudo { get; set; } = "Nuevo";

    [Required]
    public Guid AgenteId { get; set; }
    public Agent? Agente { get; set; }

    public string? Notas { get; set; }

    [Required]
    public bool EsPropietario { get; set; } = false;

    public DateTimeOffset FechaCreacion { get; set; } = DateTimeOffset.UtcNow;

    public DateTimeOffset? FechaCierre { get; set; }

    // Relaciones de navegación
    public ICollection<Property> PropertiesOwned { get; set; } = new List<Property>();
    public ICollection<LeadPropertyInterest> PropertyInterests { get; set; } = new List<LeadPropertyInterest>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
}
