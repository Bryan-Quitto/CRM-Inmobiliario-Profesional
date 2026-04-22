using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Registro histórico de hitos transaccionales de una propiedad.
/// </summary>
public sealed class PropertyTransaction
{
    public Guid Id { get; set; }

    [Required]
    public Guid PropertyId { get; set; }
    public Property? Property { get; set; }

    public Guid? LeadId { get; set; }
    public Lead? Lead { get; set; }

    [Required]
    [MaxLength(50)]
    public string TransactionType { get; set; } = string.Empty; // "Sale", "Rent", "Cancellation", "Relisting"

    public decimal? Amount { get; set; }

    [Required]
    public DateTimeOffset TransactionDate { get; set; }

    public string? Notes { get; set; }

    [Required]
    public Guid CreatedById { get; set; }
    public Agent? CreatedBy { get; set; }
}
