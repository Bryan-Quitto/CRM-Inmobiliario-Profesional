using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class PropertyMediaConfiguration : IEntityTypeConfiguration<PropertyMedia>
{
    public void Configure(EntityTypeBuilder<PropertyMedia> builder)
    {
        builder.Property(e => e.TipoMultimedia).HasMaxLength(50);
        builder.Property(e => e.StoragePath).HasMaxLength(255);
        builder.Property(e => e.Descripcion).HasMaxLength(500);

        builder.HasOne(d => d.Propiedad)
            .WithMany(p => p.Media)
            .HasForeignKey(d => d.PropiedadId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Section)
            .WithMany(p => p.Media)
            .HasForeignKey(d => d.SectionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
