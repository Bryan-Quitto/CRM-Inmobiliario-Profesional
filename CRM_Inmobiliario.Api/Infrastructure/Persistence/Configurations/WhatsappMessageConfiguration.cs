using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class WhatsappMessageConfiguration : IEntityTypeConfiguration<WhatsappMessage>
{
    public void Configure(EntityTypeBuilder<WhatsappMessage> builder)
    {
        builder.Property(e => e.Telefono).HasMaxLength(20);
        builder.Property(e => e.Rol).HasMaxLength(20);
        builder.HasIndex(e => new { e.Telefono, e.Fecha })
              .HasDatabaseName("IX_WhatsappMessages_TelefonoFecha");
    }
}
