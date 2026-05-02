using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Gestión de contactos (prospectos, clientes potenciales o propietarios).
/// </summary>
public sealed class Contacto
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [MaxLength(100)]
    public string? Apellido { get; set; }

    [EmailAddress]
    [MaxLength(150)]
    public string? Email { get; set; }

    [Required]
    [MaxLength(20)]
    public string Telefono { get; set; } = string.Empty;

    [MaxLength(50)]
    public string Origen { get; set; } = "Directo";

    [MaxLength(50)]
    public string EtapaEmbudo { get; set; } = "Nuevo";

    [Required]
    public bool EsProspecto { get; set; } = true;

    [Required]
    [MaxLength(50)]
    public string EstadoPropietario { get; set; } = "Activo";

    [Required]
    public bool EsPropietario { get; set; } = false;

    public string? Notas { get; set; }

    public DateTimeOffset FechaCreacion { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? FechaCierre { get; set; }

    [Required]
    public Guid AgenteId { get; set; }
    public Agent? Agente { get; set; }

    // Relaciones de navegación
    public ICollection<Property> PropertiesOwned { get; set; } = new List<Property>();
    public ICollection<PropertyTransaction> Transactions { get; set; } = new List<PropertyTransaction>();
    public ICollection<ContactoInteresPropiedad> PropertyInterests { get; set; } = new List<ContactoInteresPropiedad>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
}
