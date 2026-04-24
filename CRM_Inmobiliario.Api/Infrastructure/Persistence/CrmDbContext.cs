using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Infrastructure.Persistence;

public sealed class CrmDbContext : DbContext
{
    public CrmDbContext(DbContextOptions<CrmDbContext> options) : base(options)
    {
    }

    public DbSet<Agent> Agents => Set<Agent>();
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

        // Agentes
        modelBuilder.Entity<Agent>(entity =>
        {
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Nombre).HasMaxLength(100);
            entity.Property(e => e.Apellido).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Telefono).HasMaxLength(20);
            entity.Property(e => e.Rol).HasMaxLength(50);
        });

        // Clientes (Leads)
        modelBuilder.Entity<Lead>(entity =>
        {
            entity.Property(e => e.Nombre).HasMaxLength(100);
            entity.Property(e => e.Apellido).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(255);
            entity.Property(e => e.Telefono).HasMaxLength(20);
            entity.Property(e => e.Origen).HasMaxLength(50);
            entity.Property(e => e.EtapaEmbudo).HasMaxLength(50);

            // ÍNDICE DE RENDIMIENTO: Búsqueda y conteo por agente, etapa y fechas
            entity.HasIndex(e => new { e.AgenteId, e.EtapaEmbudo, e.FechaCierre, e.FechaCreacion })
                  .HasDatabaseName("IX_Leads_Performance_AgenteEtapaFecha");

            entity.HasOne(d => d.Agente)
                .WithMany(p => p.Leads)
                .HasForeignKey(d => d.AgenteId)
                .IsRequired(false)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Propiedades
        modelBuilder.Entity<Property>(entity =>
        {
            entity.Property(e => e.Titulo).HasMaxLength(150);
            entity.Property(e => e.TipoPropiedad).HasMaxLength(50);
            entity.Property(e => e.Operacion).HasMaxLength(50);
            entity.Property(e => e.Direccion).HasMaxLength(255);
            entity.Property(e => e.Sector).HasMaxLength(100);
            entity.Property(e => e.Ciudad).HasMaxLength(100);
            entity.Property(e => e.EstadoComercial).HasMaxLength(50);

            entity.Property(e => e.Precio).HasColumnType("decimal(12,2)");
            entity.Property(e => e.PrecioCierre).HasColumnType("decimal(12,2)");
            entity.Property(e => e.Banos).HasColumnType("decimal(3,1)");
            entity.Property(e => e.AreaTotal).HasColumnType("decimal(10,2)");

            // ÍNDICE DE RENDIMIENTO: Conteo por agente, estado, captación y fecha ingreso
            entity.HasIndex(e => new { e.AgenteId, e.EstadoComercial, e.EsCaptacionPropia, e.FechaIngreso })
                  .HasDatabaseName("IX_Properties_Performance_AgenteEstadoCaptacion");

            entity.HasOne(d => d.Agente)
                .WithMany(p => p.Properties)
                .HasForeignKey(d => d.AgenteId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(d => d.Propietario)
                .WithMany(p => p.PropertiesOwned)
                .HasForeignKey(d => d.PropietarioId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Multimedia
        modelBuilder.Entity<PropertyMedia>(entity =>
        {
            entity.Property(e => e.TipoMultimedia).HasMaxLength(50);
            entity.Property(e => e.StoragePath).HasMaxLength(255);
            entity.Property(e => e.Descripcion).HasMaxLength(500);

            entity.HasOne(d => d.Propiedad)
                .WithMany(p => p.Media)
                .HasForeignKey(d => d.PropiedadId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Section)
                .WithMany(p => p.Media)
                .HasForeignKey(d => d.SectionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Secciones de Galería
        modelBuilder.Entity<PropertyGallerySection>(entity =>
        {
            entity.Property(e => e.Nombre).HasMaxLength(100).IsRequired();

            entity.HasOne(d => d.Propiedad)
                .WithMany(p => p.GallerySections)
                .HasForeignKey(d => d.PropiedadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Intereses (Many-to-Many Bridge)
        modelBuilder.Entity<LeadPropertyInterest>(entity =>
        {
            entity.HasKey(e => new { e.ClienteId, e.PropiedadId });

            entity.Property(e => e.NivelInteres).HasMaxLength(50);

            entity.HasOne(d => d.Cliente)
                .WithMany(p => p.PropertyInterests)
                .HasForeignKey(d => d.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Propiedad)
                .WithMany(p => p.LeadInterests)
                .HasForeignKey(d => d.PropiedadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Tareas
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity.Property(e => e.Titulo).HasMaxLength(150);
            entity.Property(e => e.TipoTarea).HasMaxLength(50);
            entity.Property(e => e.Estado).HasMaxLength(50);
            entity.Property(e => e.ColorHex).HasMaxLength(7);
            entity.Property(e => e.DuracionMinutos).IsRequired();

            // ÍNDICE DE RENDIMIENTO: Conteo por agente, estado, tipo y fecha inicio
            entity.HasIndex(e => new { e.AgenteId, e.Estado, e.TipoTarea, e.FechaInicio })
                  .HasDatabaseName("IX_Tasks_Performance_AgenteEstadoTipoFecha");

            entity.HasOne(d => d.Agente)
                .WithMany(p => p.Tasks)
                .HasForeignKey(d => d.AgenteId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Cliente)
                .WithMany(p => p.Tasks)
                .HasForeignKey(d => d.ClienteId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.Propiedad)
                .WithMany(p => p.Tasks)
                .HasForeignKey(d => d.PropiedadId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Interacciones
        modelBuilder.Entity<Interaction>(entity =>
        {
            entity.Property(e => e.TipoInteraccion).HasMaxLength(50);

            entity.HasOne(d => d.Agente)
                .WithMany(p => p.Interactions)
                .HasForeignKey(d => d.AgenteId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Cliente)
                .WithMany(p => p.Interactions)
                .HasForeignKey(d => d.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Propiedad)
                .WithMany(p => p.Interactions)
                .HasForeignKey(d => d.PropiedadId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // WhatsApp AI
        modelBuilder.Entity<WhatsappConversation>(entity =>
        {
            entity.Property(e => e.Telefono).HasMaxLength(20);
        });

        modelBuilder.Entity<AiActionLog>(entity =>
        {
            entity.Property(e => e.TelefonoCliente).HasMaxLength(20);
            entity.Property(e => e.Accion).HasMaxLength(100);

            // Index por teléfono y fecha para auditorías
            entity.HasIndex(e => new { e.TelefonoCliente, e.Fecha })
                  .HasDatabaseName("IX_AiActionLogs_TelefonoFecha");
        });

        modelBuilder.Entity<WhatsappMessage>(entity =>
        {
            entity.Property(e => e.Telefono).HasMaxLength(20);
            entity.Property(e => e.Rol).HasMaxLength(20);
            entity.HasIndex(e => new { e.Telefono, e.Fecha })
                  .HasDatabaseName("IX_WhatsappMessages_TelefonoFecha");
        });

        // Transacciones de Propiedades
        modelBuilder.Entity<PropertyTransaction>(entity =>
        {
            entity.Property(e => e.TransactionType).HasMaxLength(50);
            entity.Property(e => e.Amount).HasColumnType("decimal(12,2)");

            // ÍNDICE DE RENDIMIENTO: Historial por propiedad y fecha
            entity.HasIndex(e => new { e.PropertyId, e.TransactionDate })
                  .HasDatabaseName("IX_PropertyTransactions_PropertyDate");

            entity.HasOne(d => d.Property)
                .WithMany(p => p.Transactions)
                .HasForeignKey(d => d.PropertyId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(d => d.Lead)
                .WithMany()
                .HasForeignKey(d => d.LeadId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(d => d.CreatedBy)
                .WithMany()
                .HasForeignKey(d => d.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // CONVERTIDOR GLOBAL UTC (Spec 011 / Npgsql Fix)
        // PostgreSQL timestamp with time zone requiere offset 0 (UTC)
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTimeOffset) || property.ClrType == typeof(DateTimeOffset?))
                {
                    property.SetValueConverter(new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTimeOffset, DateTimeOffset>(
                        v => v.ToUniversalTime(),
                        v => v.ToOffset(TimeSpan.FromHours(-5)))); // Recuperar siempre con el offset de Ecuador
                }
            }
        }
    }
}
