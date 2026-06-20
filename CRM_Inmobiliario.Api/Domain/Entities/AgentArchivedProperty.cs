using System;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class AgentArchivedProperty
{
    public Guid AgentId { get; set; }
    public Agent Agent { get; set; } = null!;

    public Guid PropiedadId { get; set; }
    public Property Propiedad { get; set; } = null!;

    public DateTimeOffset ArchivedAt { get; set; }
}
