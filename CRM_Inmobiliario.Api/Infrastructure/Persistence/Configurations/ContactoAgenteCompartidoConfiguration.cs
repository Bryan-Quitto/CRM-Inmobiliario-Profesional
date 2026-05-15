using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public sealed class ContactoAgenteCompartidoConfiguration : IEntityTypeConfiguration<ContactoAgenteCompartido>
{
    public void Configure(EntityTypeBuilder<ContactoAgenteCompartido> builder)
    {
        builder.ToTable("ContactoAgenteCompartidos");

        // Clave primaria compuesta
        builder.HasKey(c => new { c.ContactoId, c.AgenteId });

        // Relación con Contacto
        builder.HasOne(c => c.Contacto)
               .WithMany(c => c.CompartidoCon)
               .HasForeignKey(c => c.ContactoId)
               .OnDelete(DeleteBehavior.Cascade);

        // Relación con Agente (Receptor)
        builder.HasOne(c => c.Agente)
               .WithMany(a => a.ContactosCompartidos)
               .HasForeignKey(c => c.AgenteId)
               .OnDelete(DeleteBehavior.Cascade);
    }
}
