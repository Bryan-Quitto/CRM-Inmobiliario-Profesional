using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Agenda del agente.
/// </summary>
public sealed class TaskItem
{
    public Guid Id { get; set; }

    [Required]
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

    public DateTimeOffset FechaInicio { get; set; }

    public int DuracionMinutos { get; set; } = 30;

    [MaxLength(7)]
    public string? ColorHex { get; set; }

    [Required]
    [MaxLength(50)]
    public string Estado { get; set; } = "Pendiente";
}
