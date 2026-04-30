using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class PropertyConfiguration : IEntityTypeConfiguration<Property>
{
    public void Configure(EntityTypeBuilder<Property> builder)
    {
        builder.Property(e => e.Titulo).HasMaxLength(150);
        builder.Property(e => e.TipoPropiedad).HasMaxLength(50);
        builder.Property(e => e.Operacion).HasMaxLength(50);
        builder.Property(e => e.Direccion).HasMaxLength(255);
        builder.Property(e => e.Sector).HasMaxLength(100);
        builder.Property(e => e.Ciudad).HasMaxLength(100);
        builder.Property(e => e.EstadoComercial).HasMaxLength(50);

        builder.Property(e => e.Precio).HasColumnType("decimal(12,2)");
        builder.Property(e => e.PrecioCierre).HasColumnType("decimal(12,2)");
        builder.Property(e => e.Banos).HasColumnType("decimal(3,1)");
        builder.Property(e => e.AreaTotal).HasColumnType("decimal(10,2)");

        // ÍNDICE DE RENDIMIENTO: Conteo por agente, estado, captación y fecha ingreso
        builder.HasIndex(e => new { e.AgenteId, e.EstadoComercial, e.EsCaptacionPropia, e.FechaIngreso })
              .HasDatabaseName("IX_Properties_Performance_AgenteEstadoCaptacion");

        builder.HasOne(d => d.Agente)
            .WithMany(p => p.Properties)
            .HasForeignKey(d => d.AgenteId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(d => d.Propietario)
            .WithMany(p => p.PropertiesOwned)
            .HasForeignKey(d => d.PropietarioId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
