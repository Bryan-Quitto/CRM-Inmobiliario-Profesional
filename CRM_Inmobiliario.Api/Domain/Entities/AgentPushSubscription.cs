using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Stores VAPID push notification subscriptions per agent.
/// Support multiple devices per agent.
/// </summary>
public sealed class AgentPushSubscription
{
    public Guid Id { get; set; }

    public Guid AgentId { get; set; }
    public Agent Agent { get; set; } = null!;

    [Required]
    public string Endpoint { get; set; } = string.Empty;

    [Required]
    public string P256dh { get; set; } = string.Empty;

    [Required]
    public string Auth { get; set; } = string.Empty;

    public string? UserAgent { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastUsedAt { get; set; }
}
