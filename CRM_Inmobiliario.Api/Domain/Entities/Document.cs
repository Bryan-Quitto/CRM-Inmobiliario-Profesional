using System;
using CRM_Inmobiliario.Api.Domain.Enums;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class Document
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Source { get; set; } = string.Empty;
    public DocumentAudience Audience { get; set; } = DocumentAudience.Public;
    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<DocumentChunk> Chunks { get; set; } = new List<DocumentChunk>();
}
