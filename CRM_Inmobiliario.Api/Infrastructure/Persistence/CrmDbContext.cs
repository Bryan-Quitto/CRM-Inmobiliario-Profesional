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
    public DbSet<FacebookConversation> FacebookConversations => Set<FacebookConversation>();
    public DbSet<FacebookMessage> FacebookMessages => Set<FacebookMessage>();
    public DbSet<AgentPushSubscription> AgentPushSubscriptions => Set<AgentPushSubscription>();
    public DbSet<PushNotificationsOutbox> PushNotificationsOutbox => Set<PushNotificationsOutbox>();
    public DbSet<PropertyFaq> PropertyFaqs => Set<PropertyFaq>();
    public DbSet<AgentArchivedContact> AgentArchivedContacts => Set<AgentArchivedContact>();
    public DbSet<AgentArchivedProperty> AgentArchivedProperties => Set<AgentArchivedProperty>();
    public DbSet<AgentContactActivity> AgentContactActivities => Set<AgentContactActivity>();
    public DbSet<AgentPropertyActivity> AgentPropertyActivities => Set<AgentPropertyActivity>();
    public DbSet<CRM_Inmobiliario.Api.Features.Shared.OmniSearch.OmniSearchResult> OmniSearchResults => Set<CRM_Inmobiliario.Api.Features.Shared.OmniSearch.OmniSearchResult>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        if (Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL")
        {
            modelBuilder.HasPostgresExtension("unaccent");
            modelBuilder.HasPostgresExtension("vector");
            modelBuilder.HasPostgresExtension("pg_trgm");
        }
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<CRM_Inmobiliario.Api.Features.Shared.OmniSearch.OmniSearchResult>()
            .ToView("vw_omni_search")
            .HasNoKey();

        modelBuilder.Entity<AgentConversation>()
            .HasMany(c => c.Messages)
            .WithOne(m => m.AgentConversation)
            .HasForeignKey(m => m.AgentConversationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Contacto>()
            .HasIndex(c => c.NormalizedSearchText)
            .HasDatabaseName("idx_contactos_search")
            .HasMethod("gin")
            .HasOperators("gin_trgm_ops");

        modelBuilder.Entity<Property>()
            .HasIndex(p => p.NormalizedSearchText)
            .HasDatabaseName("idx_properties_search")
            .HasMethod("gin")
            .HasOperators("gin_trgm_ops");

        modelBuilder.Entity<PropertyFaq>(entity =>
        {
            entity.HasIndex(f => new { f.PropiedadId, f.Estado })
                .HasDatabaseName("idx_property_faqs_propiedad_estado");

            entity.HasOne(f => f.Propiedad)
                .WithMany()
                .HasForeignKey(f => f.PropiedadId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.CreadoPorAgente)
                .WithMany()
                .HasForeignKey(f => f.CreadoPorAgenteId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<AgentArchivedContact>(entity =>
        {
            entity.HasKey(e => new { e.AgentId, e.ContactoId });
            entity.HasOne(e => e.Agent).WithMany().HasForeignKey(e => e.AgentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Contacto).WithMany().HasForeignKey(e => e.ContactoId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AgentArchivedProperty>(entity =>
        {
            entity.HasKey(e => new { e.AgentId, e.PropiedadId });
            entity.HasOne(e => e.Agent).WithMany().HasForeignKey(e => e.AgentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Propiedad).WithMany().HasForeignKey(e => e.PropiedadId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AgentContactActivity>(entity =>
        {
            entity.HasKey(e => new { e.AgentId, e.ContactoId });
            entity.HasOne(e => e.Agent).WithMany().HasForeignKey(e => e.AgentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Contacto).WithMany().HasForeignKey(e => e.ContactoId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<AgentPropertyActivity>(entity =>
        {
            entity.HasKey(e => new { e.AgentId, e.PropertyId });
            entity.HasOne(e => e.Agent).WithMany().HasForeignKey(e => e.AgentId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(e => e.Property).WithMany().HasForeignKey(e => e.PropertyId).OnDelete(DeleteBehavior.Cascade);
        });

        // Aplicar todas las configuraciones de IEntityTypeConfiguration encontradas en el ensamblado
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CrmDbContext).Assembly);

        if (Database.ProviderName != "Npgsql.EntityFrameworkCore.PostgreSQL")
        {
            foreach (var entityType in modelBuilder.Model.GetEntityTypes().ToList())
            {
                var vectorProperties = entityType.GetProperties()
                    .Where(p => p.ClrType == typeof(Pgvector.Vector))
                    .ToList();

                foreach (var property in vectorProperties)
                {
                    modelBuilder.Entity(entityType.ClrType).Ignore(property.Name);
                }
            }
        }

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

    public async Task UpsertAgentContactActivityAsync(Guid agentId, Guid contactoId, DateTimeOffset timestamp, CancellationToken ct = default)
    {
        await Database.ExecuteSqlRawAsync(
            @"INSERT INTO ""AgentContactActivities"" (""AgentId"", ""ContactoId"", ""LastActivityUtc"")
              VALUES ({0}, {1}, {2})
              ON CONFLICT (""AgentId"", ""ContactoId"") 
              DO UPDATE SET ""LastActivityUtc"" = EXCLUDED.""LastActivityUtc"";",
            agentId, contactoId, timestamp.ToUniversalTime());
    }

    public async Task UpsertAgentPropertyActivityAsync(Guid agentId, Guid propertyId, DateTimeOffset timestamp, CancellationToken ct = default)
    {
        await Database.ExecuteSqlRawAsync(
            @"INSERT INTO ""AgentPropertyActivities"" (""AgentId"", ""PropertyId"", ""LastActivityUtc"")
              VALUES ({0}, {1}, {2})
              ON CONFLICT (""AgentId"", ""PropertyId"") 
              DO UPDATE SET ""LastActivityUtc"" = EXCLUDED.""LastActivityUtc"";",
            agentId, propertyId, timestamp.ToUniversalTime());
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var contactEntries = ChangeTracker.Entries<Contacto>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in contactEntries)
        {
            var c = entry.Entity;
            c.NormalizedSearchText = NormalizeText($"{c.Nombre} {c.Apellido} {c.Email} {c.Telefono}");
        }

        var propertyEntries = ChangeTracker.Entries<Property>()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified)
            .ToList();

        foreach (var entry in propertyEntries)
        {
            var p = entry.Entity;
            var text = NormalizeText($"{p.Titulo} {p.Descripcion} {p.Sector} {p.Ciudad}");
            p.NormalizedSearchText = text.Length > 2000 ? text.Substring(0, 2000) : text;
        }

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

    public static string NormalizeText(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return string.Empty;
        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new System.Text.StringBuilder();

        foreach (var c in normalizedString)
        {
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC).ToLowerInvariant();
    }
}
