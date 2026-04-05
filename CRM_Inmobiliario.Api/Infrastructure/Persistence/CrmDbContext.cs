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
    }
}
