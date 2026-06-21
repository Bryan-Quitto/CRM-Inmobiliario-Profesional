using System;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class AgentContactActivity
{
    public Guid AgentId { get; set; }
    public Agent Agent { get; set; } = null!;
    
    public Guid ContactoId { get; set; }
    public Contacto Contacto { get; set; } = null!;

    public DateTimeOffset LastActivityUtc { get; set; }
}
