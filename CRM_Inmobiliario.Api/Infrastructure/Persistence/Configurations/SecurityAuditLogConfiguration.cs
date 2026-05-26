using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public sealed class SecurityAuditLogConfiguration : IEntityTypeConfiguration<SecurityAuditLog>
{
    public void Configure(EntityTypeBuilder<SecurityAuditLog> builder)
    {
        builder.ToTable("SecurityAuditLogs");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.TipoIncidente).HasMaxLength(100).IsRequired();
        builder.Property(x => x.Descripcion).HasMaxLength(500).IsRequired();
        
        builder.HasIndex(x => x.AgenteId);
        builder.HasIndex(x => x.Timestamp);

        builder.HasOne(x => x.Agente)
            .WithMany()
            .HasForeignKey(x => x.AgenteId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
