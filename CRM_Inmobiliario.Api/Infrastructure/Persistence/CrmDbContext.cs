using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence;

public sealed class CrmDbContext : DbContext
{
    public CrmDbContext(DbContextOptions<CrmDbContext> options) : base(options)
    {
    }

    public DbSet<Agent> Agents => Set<Agent>();
    public DbSet<Agency> Agencies => Set<Agency>();
    public DbSet<Lead> Leads => Set<Lead>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<PropertyGallerySection> PropertyGallerySections => Set<PropertyGallerySection>();
    public DbSet<PropertyMedia> PropertyMedia => Set<PropertyMedia>();
    public DbSet<LeadPropertyInterest> LeadPropertyInterests => Set<LeadPropertyInterest>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Interaction> Interactions => Set<Interaction>();
    public DbSet<WhatsappConversation> WhatsappConversations => Set<WhatsappConversation>();
    public DbSet<AiActionLog> AiActionLogs => Set<AiActionLog>();
    public DbSet<WhatsappMessage> WhatsappMessages => Set<WhatsappMessage>();
    public DbSet<PropertyTransaction> PropertyTransactions => Set<PropertyTransaction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Aplicar todas las configuraciones de IEntityTypeConfiguration encontradas en el ensamblado
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CrmDbContext).Assembly);

        // CONVERTIDOR GLOBAL UTC (Spec 011 / Npgsql Fix)
        // PostgreSQL timestamp with time zone requiere offset 0 (UTC)
        ConfigureGlobalDateTimeOffsetConverter(modelBuilder);
    }

    private static void ConfigureGlobalDateTimeOffsetConverter(ModelBuilder modelBuilder)
    {
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTimeOffset) || property.ClrType == typeof(DateTimeOffset?))
                {
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTimeOffset, DateTimeOffset>(
                        v => v.ToUniversalTime(),
                        v => v.ToOffset(TimeSpan.FromHours(-5)))); // Recuperar siempre con el offset de Ecuador (UTC-5)
                }
            }
        }
    }
}
