using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence;

public sealed class CrmDbContext : DbContext
{
    public CrmDbContext(DbContextOptions<CrmDbContext> options) : base(options)
    {
    }

    public DbSet<Agent> Agents => Set<Agent>();
    public DbSet<Agency> Agencies => Set<Agency>();
    public DbSet<Contacto> Contactos => Set<Contacto>();
    public DbSet<ContactoAgenteCompartido> ContactoAgenteCompartidos => Set<ContactoAgenteCompartido>();
    public DbSet<Property> Properties => Set<Property>();
    public DbSet<PropertyGallerySection> PropertyGallerySections => Set<PropertyGallerySection>();
    public DbSet<PropertyMedia> PropertyMedia => Set<PropertyMedia>();
    public DbSet<ContactoInteresPropiedad> ContactoInteresPropiedades => Set<ContactoInteresPropiedad>();
    public DbSet<TaskItem> Tasks => Set<TaskItem>();
    public DbSet<Interaction> Interactions => Set<Interaction>();
    public DbSet<WhatsappConversation> WhatsappConversations => Set<WhatsappConversation>();
    public DbSet<AiActionLog> AiActionLogs => Set<AiActionLog>();
    public DbSet<WhatsappMessage> WhatsappMessages => Set<WhatsappMessage>();
    public DbSet<PropertyTransaction> PropertyTransactions => Set<PropertyTransaction>();
    public DbSet<ContactoHistorialEmbudo> ContactoHistorialEmbudos => Set<ContactoHistorialEmbudo>();
    public DbSet<Document> Documents => Set<Document>();
    public DbSet<DocumentChunk> DocumentChunks => Set<DocumentChunk>();
    public DbSet<SecurityAuditLog> SecurityAuditLogs => Set<SecurityAuditLog>();
    public DbSet<ContactDailyTokenUsage> ContactDailyTokenUsages => Set<ContactDailyTokenUsage>();
    public DbSet<AgentDailyTokenUsage> AgentDailyTokenUsages => Set<AgentDailyTokenUsage>();
    public DbSet<AgentConversation> AgentConversations => Set<AgentConversation>();
    public DbSet<AgentMessage> AgentMessages => Set<AgentMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        if (Database.IsRelational())
        {
            modelBuilder.HasPostgresExtension("unaccent");
            modelBuilder.HasPostgresExtension("vector");
        }
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<AgentConversation>()
            .HasMany(c => c.Messages)
            .WithOne(m => m.AgentConversation)
            .HasForeignKey(m => m.AgentConversationId)
            .OnDelete(DeleteBehavior.Cascade);

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

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries<Contacto>()
            .Where(e => e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            var originalEtapa = entry.OriginalValues.GetValue<string>("EtapaEmbudo");
            var currentEtapa = entry.CurrentValues.GetValue<string>("EtapaEmbudo");

            if (originalEtapa != currentEtapa)
            {
                ContactoHistorialEmbudos.Add(new ContactoHistorialEmbudo
                {
                    Id = Guid.NewGuid(),
                    ContactoId = entry.Entity.Id,
                    EtapaAnterior = originalEtapa ?? string.Empty,
                    EtapaNueva = currentEtapa ?? string.Empty,
                    FechaCambio = DateTimeOffset.UtcNow
                });
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
