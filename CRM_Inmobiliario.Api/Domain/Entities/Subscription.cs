using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public sealed class Subscription
{
    public Guid Id { get; set; }
    public Guid AgentId { get; set; }
    
    [Required]
    [MaxLength(20)]
    public string PlanTier { get; set; } = "Normal";
    
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "Active";
    
    public DateTimeOffset CurrentPeriodStart { get; set; }
    public DateTimeOffset CurrentPeriodEnd { get; set; }
    
    public bool IsManualOverride { get; set; } = false;
    
    [MaxLength(1000)]
    public string? PaymentNotes { get; set; }
    
    [MaxLength(100)]
    public string? ExternalCustomerId { get; set; }
    
    [MaxLength(100)]
    public string? ExternalSubscriptionId { get; set; }
    
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
    
    public Agent? Agent { get; set; }
}
