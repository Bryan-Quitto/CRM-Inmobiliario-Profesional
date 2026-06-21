using System;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class AgentPropertyActivity
{
    public Guid AgentId { get; set; }
    public Agent Agent { get; set; } = null!;
    
    public Guid PropertyId { get; set; }
    public Property Property { get; set; } = null!;

    public DateTimeOffset LastActivityUtc { get; set; }
}
