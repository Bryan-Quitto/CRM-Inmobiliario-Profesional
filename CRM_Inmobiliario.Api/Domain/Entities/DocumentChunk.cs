using System;
using Pgvector;
using CRM_Inmobiliario.Api.Domain.Enums;

namespace CRM_Inmobiliario.Api.Domain.Entities;

public class DocumentChunk
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public string Content { get; set; } = string.Empty;
    public Vector? Embedding { get; set; }
    public int ChunkIndex { get; set; }
    public DocumentAudience Audience { get; set; } = DocumentAudience.Public;
    public DateTimeOffset CreatedAt { get; set; }

    public Document? Document { get; set; }
}
