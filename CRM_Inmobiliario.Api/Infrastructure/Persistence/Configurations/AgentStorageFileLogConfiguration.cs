using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class AgentStorageFileLogConfiguration : IEntityTypeConfiguration<AgentStorageFileLog>
{
    public void Configure(EntityTypeBuilder<AgentStorageFileLog> builder)
    {
        builder.HasKey(e => e.Id);
        
        builder.Property(e => e.ObjectKey).IsRequired().HasMaxLength(255);
        builder.Property(e => e.TargetType).HasMaxLength(50);
        builder.Property(e => e.TargetId).HasMaxLength(100);
        builder.Property(e => e.Context).HasMaxLength(255);
        
        builder.HasOne(e => e.Agent)
            .WithMany()
            .HasForeignKey(e => e.AgentId)
            .OnDelete(DeleteBehavior.Cascade);
            
        builder.HasIndex(e => e.AgentId);
        builder.HasIndex(e => e.ObjectKey);
    }
}
