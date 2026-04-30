using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class LeadPropertyInterestConfiguration : IEntityTypeConfiguration<LeadPropertyInterest>
{
    public void Configure(EntityTypeBuilder<LeadPropertyInterest> builder)
    {
        builder.HasKey(e => new { e.ClienteId, e.PropiedadId });

        builder.Property(e => e.NivelInteres).HasMaxLength(50);

        builder.HasOne(d => d.Cliente)
            .WithMany(p => p.PropertyInterests)
            .HasForeignKey(d => d.ClienteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Propiedad)
            .WithMany(p => p.LeadInterests)
            .HasForeignKey(d => d.PropiedadId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
