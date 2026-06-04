using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class AgentConversation
{
    public Guid Id { get; set; }

    public Guid AgentId { get; set; }
    public Agent? Agent { get; set; }

    [MaxLength(100)]
    public string? Title { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<AgentMessage> Messages { get; set; } = new List<AgentMessage>();
}
