using System;
using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

/// <summary>
/// Cola de procesamiento para el borrado diferido (Outbox Pattern) de archivos en Cloudflare R2.
/// </summary>
public class PendingStorageDeletion
{
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string ObjectKey { get; set; } = string.Empty;
    
    public Guid AgentId { get; set; }
    
    public Agent? Agent { get; set; }
    
    public long FileSizeBytes { get; set; }
    
    public DateTimeOffset CreatedAt { get; set; }
    
    public int RetryCount { get; set; }
    
    [MaxLength(1000)]
    public string? LastError { get; set; }
}
