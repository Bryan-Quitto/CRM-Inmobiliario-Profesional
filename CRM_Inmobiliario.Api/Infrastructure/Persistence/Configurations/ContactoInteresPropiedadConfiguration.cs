using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class ContactoInteresPropiedadConfiguration : IEntityTypeConfiguration<ContactoInteresPropiedad>
{
    public void Configure(EntityTypeBuilder<ContactoInteresPropiedad> builder)
    {
        builder.HasKey(e => new { e.ContactoId, e.PropiedadId });

        builder.Property(e => e.NivelInteres).HasMaxLength(50);

        builder.HasOne(d => d.Contacto)
            .WithMany(p => p.PropertyInterests)
            .HasForeignKey(d => d.ContactoId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Propiedad)
            .WithMany(p => p.ContactInterests)
            .HasForeignKey(d => d.PropiedadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
