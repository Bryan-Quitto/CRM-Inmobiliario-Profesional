using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class PropertyGallerySectionConfiguration : IEntityTypeConfiguration<PropertyGallerySection>
{
    public void Configure(EntityTypeBuilder<PropertyGallerySection> builder)
    {
        builder.Property(e => e.Nombre).HasMaxLength(100).IsRequired();

        builder.HasOne(d => d.Propiedad)
            .WithMany(p => p.GallerySections)
            .HasForeignKey(d => d.PropiedadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
