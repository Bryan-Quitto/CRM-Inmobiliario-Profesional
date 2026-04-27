using System;
using System.Collections.Generic;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class Agency
{
    public Guid Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public DateTimeOffset FechaCreacion { get; set; }

    // Relación con Agentes
    public ICollection<Agent> Agents { get; set; } = new List<Agent>();
}
