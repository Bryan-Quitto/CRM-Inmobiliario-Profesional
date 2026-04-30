using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class TaskItemConfiguration : IEntityTypeConfiguration<TaskItem>
{
    public void Configure(EntityTypeBuilder<TaskItem> builder)
    {
        builder.Property(e => e.Titulo).HasMaxLength(150);
        builder.Property(e => e.TipoTarea).HasMaxLength(50);
        builder.Property(e => e.Estado).HasMaxLength(50);
        builder.Property(e => e.ColorHex).HasMaxLength(7);
        builder.Property(e => e.DuracionMinutos).IsRequired();

        // ÍNDICE DE RENDIMIENTO: Conteo por agente, estado, tipo y fecha inicio
        builder.HasIndex(e => new { e.AgenteId, e.Estado, e.TipoTarea, e.FechaInicio })
              .HasDatabaseName("IX_Tasks_Performance_AgenteEstadoTipoFecha");

        builder.HasOne(d => d.Agente)
            .WithMany(p => p.Tasks)
            .HasForeignKey(d => d.AgenteId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(d => d.Cliente)
            .WithMany(p => p.Tasks)
            .HasForeignKey(d => d.ClienteId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(d => d.Propiedad)
            .WithMany(p => p.Tasks)
            .HasForeignKey(d => d.PropiedadId)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
