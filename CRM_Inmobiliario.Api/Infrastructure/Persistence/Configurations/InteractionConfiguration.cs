using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class InteractionConfiguration : IEntityTypeConfiguration<Interaction>
{
    public void Configure(EntityTypeBuilder<Interaction> builder)
    {
        builder.Property(e => e.TipoInteraccion).HasMaxLength(50);

        builder.HasOne(d => d.Agente)
            .WithMany(p => p.Interactions)
            .HasForeignKey(d => d.AgenteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Cliente)
            .WithMany(p => p.Interactions)
            .HasForeignKey(d => d.ClienteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Propiedad)
            .WithMany(p => p.Interactions)
            .HasForeignKey(d => d.PropiedadId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
