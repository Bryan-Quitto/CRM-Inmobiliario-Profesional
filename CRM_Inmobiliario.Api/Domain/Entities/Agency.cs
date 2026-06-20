using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class Agency
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateTimeOffset FechaCreacion { get; set; }

    [MaxLength(20)]
    public string? TelefonoCorporativo { get; set; }

    [MaxLength(255)]
    [EmailAddress]
    public string? EmailCorporativo { get; set; }

    [MaxLength(500)]
    public string? DireccionFisica { get; set; }

    [MaxLength(255)]
    public string? SitioWeb { get; set; }

    [MaxLength(2000)]
    public string? ContextoCorporativoIA { get; set; }

    public bool AutoArchivarContactos { get; set; } = false;
    [Range(100, 1095)]
    public int DiasInactividadContactos { get; set; } = 365;

    public bool AutoArchivarPropiedades { get; set; } = false;
    [Range(100, 1095)]
    public int DiasInactividadPropiedades { get; set; } = 365;

    // Relación con Agentes
    public ICollection<Agent> Agents { get; set; } = new List<Agent>();
}
