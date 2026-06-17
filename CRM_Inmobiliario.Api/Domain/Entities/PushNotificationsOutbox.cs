using System;
using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class PushNotificationsOutbox
{
    public Guid Id { get; set; }

    [MaxLength(500)]
    public required string Endpoint { get; set; }

    [MaxLength(200)]
    public required string P256dh { get; set; }

    [MaxLength(200)]
    public required string Auth { get; set; }

    [MaxLength(4000)]
    public required string Payload { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

    public int RetryCount { get; set; } = 0;
}
