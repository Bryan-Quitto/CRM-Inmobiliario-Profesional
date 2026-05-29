using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class DocumentChunkConfiguration : IEntityTypeConfiguration<DocumentChunk>
{
    public void Configure(EntityTypeBuilder<DocumentChunk> builder)
    {
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Content)
            .IsRequired();

        builder.Property(c => c.Embedding)
            .HasColumnType("vector(1536)")
            .IsRequired(false);

        builder.Property(c => c.GeminiEmbedding)
            .HasColumnType("vector(768)")
            .IsRequired(false);

        builder.Property(c => c.ChunkIndex)
            .IsRequired();

        builder.Property(c => c.CreatedAt)
            .IsRequired();

        builder.HasIndex(c => c.Embedding)
            .HasMethod("hnsw")
            .HasOperators("vector_cosine_ops");

        builder.HasIndex(c => c.GeminiEmbedding)
            .HasMethod("hnsw")
            .HasOperators("vector_cosine_ops");
    }
}
