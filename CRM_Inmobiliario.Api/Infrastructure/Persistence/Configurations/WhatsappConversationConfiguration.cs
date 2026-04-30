using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence.Configurations;

public class WhatsappConversationConfiguration : IEntityTypeConfiguration<WhatsappConversation>
{
    public void Configure(EntityTypeBuilder<WhatsappConversation> builder)
    {
        builder.Property(e => e.Telefono).HasMaxLength(20);
    }
}
