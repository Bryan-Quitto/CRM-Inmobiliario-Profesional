using System;
using System.ComponentModel.DataAnnotations;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class AgentStorageFileLog
{
    public Guid Id { get; set; }
    public Guid AgentId { get; set; }
    public Agent? Agent { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string ObjectKey { get; set; } = string.Empty;
    
    public long FileSizeBytes { get; set; }
    
    [MaxLength(50)]
    public string TargetType { get; set; } = string.Empty; 
    
    [MaxLength(100)]
    public string? TargetId { get; set; }
    
    [MaxLength(255)]
    public string? Context { get; set; } 
    
    public DateTimeOffset UploadedAt { get; set; }
    
    public bool IsDeleted { get; set; }
    
    public DateTimeOffset? DeletedAt { get; set; }
}
