using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Gestiona el acceso al sistema. El Id coincide con el UUID devuelto por Supabase Auth.
/// </summary>
public sealed class Agent
{
    public Guid Id { get; set; }

    [Required]
    [MaxLength(100)]
    public string Nombre { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Apellido { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Telefono { get; set; }

    public Guid? AgenciaId { get; set; }
    public Agency? Agencia { get; set; }

    [MaxLength(500)]
    public string? FotoUrl { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [Required]
    [MaxLength(50)]
    public string Rol { get; set; } = "Agente";

    public bool Activo { get; set; } = true;

    public DateTimeOffset FechaCreacion { get; set; } = DateTimeOffset.UtcNow;

    // Relaciones de navegación
    public ICollection<Lead> Leads { get; set; } = new List<Lead>();
    public ICollection<Property> Properties { get; set; } = new List<Property>();
    public ICollection<TaskItem> Tasks { get; set; } = new List<TaskItem>();
    public ICollection<Interaction> Interactions { get; set; } = new List<Interaction>();
}
