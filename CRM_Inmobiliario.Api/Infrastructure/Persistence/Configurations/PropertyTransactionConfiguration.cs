using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class PropertyTransactionConfiguration : IEntityTypeConfiguration<PropertyTransaction>
{
    public void Configure(EntityTypeBuilder<PropertyTransaction> builder)
    {
        builder.Property(e => e.TransactionType).HasMaxLength(50);
        builder.Property(e => e.Amount).HasColumnType("decimal(12,2)");

        // ÍNDICE DE RENDIMIENTO: Historial por propiedad y fecha
        builder.HasIndex(e => new { e.PropertyId, e.TransactionDate })
              .HasDatabaseName("IX_PropertyTransactions_PropertyDate");

        builder.HasOne(d => d.Property)
            .WithMany(p => p.Transactions)
            .HasForeignKey(d => d.PropertyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Contacto)
            .WithMany(p => p.Transactions)
            .HasForeignKey(d => d.ContactoId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(d => d.CreatedBy)
            .WithMany()
            .HasForeignKey(d => d.CreatedById)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
