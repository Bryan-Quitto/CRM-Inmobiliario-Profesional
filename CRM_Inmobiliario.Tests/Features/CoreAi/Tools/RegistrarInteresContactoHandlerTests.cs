using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Tools;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.CoreAi.Tools;

public class RegistrarInteresContactoHandlerTests
{
    private readonly Mock<ILogger<RegistrarInteresContactoHandler>> _mockLogger;
    private readonly DbContextOptions<CrmDbContext> _dbContextOptions;
    private readonly Mock<IDbContextFactory<CrmDbContext>> _mockDbContextFactory;

    public RegistrarInteresContactoHandlerTests()
    {
        _mockLogger = new Mock<ILogger<RegistrarInteresContactoHandler>>();

        _dbContextOptions = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _mockDbContextFactory = new Mock<IDbContextFactory<CrmDbContext>>();
        _mockDbContextFactory.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new CrmDbContext(_dbContextOptions));
    }

    private async Task SeedDatabaseAsync(params Property[] properties)
    {
        await using var context = new CrmDbContext(_dbContextOptions);
        context.Properties.AddRange(properties);
        await context.SaveChangesAsync();
    }

    private async Task SeedContactAsync(Contacto contacto)
    {
        await using var context = new CrmDbContext(_dbContextOptions);
        context.Contactos.Add(contacto);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task ExecuteAsync_WithMissingProperty_ReturnsErrorMessage()
    {
        // Arrange
        var handler = new RegistrarInteresContactoHandler(_mockDbContextFactory.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"nombrePropiedad\":\"Casa fantasma\",\"nivelInteres\":\"Alto\"}");
        var context = new ToolExecutionContext { ContactoId = Guid.NewGuid() };

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.Contains("Error: No se encontró ninguna propiedad que coincida", result);
    }

    [Fact]
    public async Task ExecuteAsync_WithoutContactoId_ReturnsErrorMessage()
    {
        // Arrange
        var propertyId = Guid.NewGuid();
        await SeedDatabaseAsync(new Property { Id = propertyId, Titulo = "Casa hermosa en Quito", Operacion = "Venta", TipoPropiedad = "Casa", Sector = "Norte", Ciudad = "Quito", Direccion = "Calle 1" });
        var handler = new RegistrarInteresContactoHandler(_mockDbContextFactory.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"nombrePropiedad\":\"Casa hermosa\",\"nivelInteres\":\"Alto\"}");
        var context = new ToolExecutionContext { ContactoId = null };

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.Contains("Error: El contacto debe estar registrado", result);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidData_RegistersInterest()
    {
        // Arrange
        var propertyId = Guid.NewGuid();
        var contactoId = Guid.NewGuid();
        await SeedDatabaseAsync(new Property { Id = propertyId, Titulo = "Departamento Centro", Operacion = "Venta", TipoPropiedad = "Departamento", Sector = "Centro", Ciudad = "Quito", Direccion = "Calle 2" });
        await SeedContactAsync(new Contacto { Id = contactoId, Telefono = "123456789", Nombre = "Juan Perez" });
        
        var handler = new RegistrarInteresContactoHandler(_mockDbContextFactory.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"nombrePropiedad\":\"Departamento Centro\",\"nivelInteres\":\"Alto\"}");
        var context = new ToolExecutionContext { ContactoId = contactoId };

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.Contains("Interés registrado correctamente como 'Alto'", result);

        await using var dbContext = new CrmDbContext(_dbContextOptions);
        var interest = await dbContext.ContactoInteresPropiedades.FirstOrDefaultAsync(i => i.ContactoId == contactoId && i.PropiedadId == propertyId);
        Assert.NotNull(interest);
        Assert.Equal("Alto", interest.NivelInteres);
    }

    [Fact]
    public async Task ExecuteAsync_WithDescartadaAndBudgetHistory_DowngradesToBajo()
    {
        // Arrange
        var propertyId = Guid.NewGuid();
        var contactoId = Guid.NewGuid();
        await SeedDatabaseAsync(new Property { Id = propertyId, Titulo = "Villa Lujo", Operacion = "Venta", TipoPropiedad = "Casa", Sector = "Sur", Ciudad = "Quito", Direccion = "Calle 3" });
        await SeedContactAsync(new Contacto { Id = contactoId, Telefono = "123456789", Nombre = "Juan Perez" });
        
        await using (var seedCtx = new CrmDbContext(_dbContextOptions))
        {
            seedCtx.WhatsappConversations.Add(new WhatsappConversation
            {
                Id = Guid.NewGuid(),
                ContactoId = contactoId,
                Telefono = "123",
                HistorialJson = "Usuario: Mi presupuesto es muy bajo.",
                UltimaActualizacion = DateTimeOffset.UtcNow
            });
            await seedCtx.SaveChangesAsync();
        }

        var handler = new RegistrarInteresContactoHandler(_mockDbContextFactory.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"nombrePropiedad\":\"Villa Lujo\",\"nivelInteres\":\"Descartada\"}");
        var context = new ToolExecutionContext { ContactoId = contactoId, Channel = "WhatsApp" };

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.Contains("Interés registrado correctamente como 'Bajo'", result);

        await using var dbContext = new CrmDbContext(_dbContextOptions);
        var interest = await dbContext.ContactoInteresPropiedades.FirstOrDefaultAsync(i => i.ContactoId == contactoId && i.PropiedadId == propertyId);
        Assert.NotNull(interest);
        Assert.Equal("Bajo", interest.NivelInteres);
    }
}
