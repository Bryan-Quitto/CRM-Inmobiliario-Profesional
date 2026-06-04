using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class AgentDailyTokenUsageConfiguration : IEntityTypeConfiguration<AgentDailyTokenUsage>
{
    public void Configure(EntityTypeBuilder<AgentDailyTokenUsage> builder)
    {
        builder.ToTable("AgentDailyTokenUsages");

        builder.HasKey(x => x.Id);

        builder.Property(x => x.Date)
            .IsRequired();

        builder.Property(x => x.TokensUsed)
            .IsRequired();

        builder.Property(x => x.InputTokens)
            .HasDefaultValue(0);

        builder.Property(x => x.CachedTokens)
            .HasDefaultValue(0);

        builder.Property(x => x.OutputTokens)
            .HasDefaultValue(0);

        builder.Property(x => x.CostoUSD)
            .HasColumnType("decimal(18, 6)")
            .HasDefaultValue(0);

        builder.Property(x => x.AhorroUSD)
            .HasColumnType("decimal(18, 6)")
            .HasDefaultValue(0);

        builder.HasOne(x => x.Agent)
            .WithMany()
            .HasForeignKey(x => x.AgentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(x => new { x.AgentId, x.Date }).IsUnique();
    }
}
