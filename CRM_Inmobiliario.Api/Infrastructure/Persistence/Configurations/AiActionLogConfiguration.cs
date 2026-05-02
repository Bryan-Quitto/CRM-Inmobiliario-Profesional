using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class AiActionLogConfiguration : IEntityTypeConfiguration<AiActionLog>
{
    public void Configure(EntityTypeBuilder<AiActionLog> builder)
    {
        builder.Property(e => e.TelefonoContacto).HasMaxLength(20);
        builder.Property(e => e.Accion).HasMaxLength(100);

        // Index por teléfono y fecha para auditorías
        builder.HasIndex(e => new { e.TelefonoContacto, e.Fecha })
              .HasDatabaseName("IX_AiActionLogs_TelefonoFecha");
    }
}
