using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Agenda del agente.
/// </summary>
public sealed class TaskItem
{
    public Guid Id { get; set; }

    public Guid AgenteId { get; set; }
    public Agent? Agente { get; set; }

    public Guid? ClienteId { get; set; }
    public Lead? Cliente { get; set; }

    public Guid? PropiedadId { get; set; }
    public Property? Propiedad { get; set; }

    [Required]
    [MaxLength(150)]
    public string Titulo { get; set; } = string.Empty;

    public string? Descripcion { get; set; }

    [Required]
    [MaxLength(50)]
    public string TipoTarea { get; set; } = string.Empty;

    public DateTimeOffset FechaVencimiento { get; set; }

    [Required]
    [MaxLength(50)]
    public string Estado { get; set; } = "Pendiente";
}
