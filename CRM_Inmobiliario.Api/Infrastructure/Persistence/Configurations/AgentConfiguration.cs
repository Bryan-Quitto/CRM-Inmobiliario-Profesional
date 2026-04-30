using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class AgentConfiguration : IEntityTypeConfiguration<Agent>
{
    public void Configure(EntityTypeBuilder<Agent> builder)
    {
        builder.HasIndex(e => e.Email).IsUnique();
        builder.Property(e => e.Nombre).HasMaxLength(100);
        builder.Property(e => e.Apellido).HasMaxLength(100);
        builder.Property(e => e.Email).HasMaxLength(255);
        builder.Property(e => e.Telefono).HasMaxLength(20);
        builder.Property(e => e.Rol).HasMaxLength(50);

        builder.HasOne(d => d.Agencia)
            .WithMany(p => p.Agents)
            .HasForeignKey(d => d.AgenciaId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
