using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class ContactoConfiguration : IEntityTypeConfiguration<Contacto>
{
    public void Configure(EntityTypeBuilder<Contacto> builder)
    {
        builder.Property(e => e.Nombre).HasMaxLength(100);
        builder.Property(e => e.Apellido).HasMaxLength(100);
        builder.Property(e => e.Email).HasMaxLength(150);
        builder.Property(e => e.Telefono).HasMaxLength(20);
        builder.Property(e => e.Origen).HasMaxLength(50);
        builder.Property(e => e.EtapaEmbudo).HasMaxLength(50);

        // ÍNDICE DE RENDIMIENTO: Búsqueda y conteo por agente, etapa y fechas
        builder.HasIndex(e => new { e.AgenteId, e.EtapaEmbudo, e.FechaCierre, e.FechaCreacion })
              .HasDatabaseName("IX_Contactos_Performance_AgenteEtapaFecha");

        builder.HasOne(d => d.Agente)
            .WithMany(p => p.Contactos)
            .HasForeignKey(d => d.AgenteId)
            .IsRequired()
            .OnDelete(DeleteBehavior.Restrict);
    }
}
