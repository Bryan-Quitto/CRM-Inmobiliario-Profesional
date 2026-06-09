using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class ContactDailyTokenUsageConfiguration : IEntityTypeConfiguration<ContactDailyTokenUsage>
{
    public void Configure(EntityTypeBuilder<ContactDailyTokenUsage> builder)
    {
        builder.HasKey(u => u.Id);
        builder.HasIndex(u => new { u.ContactoId, u.Date, u.Channel }).IsUnique();
    }
}
