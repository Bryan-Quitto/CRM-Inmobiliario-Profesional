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

public class ConsultarDetallesPropiedadHandlerTests
{
    private readonly Mock<ILogger<ConsultarDetallesPropiedadHandler>> _mockLogger;
    private readonly DbContextOptions<CrmDbContext> _dbContextOptions;
    private readonly Mock<IDbContextFactory<CrmDbContext>> _mockDbContextFactory;

    public ConsultarDetallesPropiedadHandlerTests()
    {
        _mockLogger = new Mock<ILogger<ConsultarDetallesPropiedadHandler>>();

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

    private async Task SeedAgentAsync(Agent agent)
    {
        await using var context = new CrmDbContext(_dbContextOptions);
        context.Agents.Add(agent);
        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task ExecuteAsync_WithMissingName_ReturnsErrorMessage()
    {
        // Arrange
        var handler = new ConsultarDetallesPropiedadHandler(_mockDbContextFactory.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{}");
        var context = new ToolExecutionContext();

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.Contains("No se especificó un nombre válido", result);
    }

    [Fact]
    public async Task ExecuteAsync_WithNonExistentProperty_ReturnsErrorMessage()
    {
        // Arrange
        var handler = new ConsultarDetallesPropiedadHandler(_mockDbContextFactory.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"nombrePropiedad\":\"Casa fantasma\"}");
        var context = new ToolExecutionContext();

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.Contains("No encontré ninguna propiedad que coincida", result);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidProperty_ReturnsPropertyDetails()
    {
        // Arrange
        await SeedDatabaseAsync(new Property 
        { 
            Id = Guid.NewGuid(), 
            Titulo = "Casa en el norte", 
            Operacion = "Venta", 
            TipoPropiedad = "Casa", 
            Precio = 120000,
            Ciudad = "Quito",
            Sector = "Norte",
            Habitaciones = 3,
            Banos = 2,
            AreaTotal = 150,
            Descripcion = "Hermosa casa."
        });

        var handler = new ConsultarDetallesPropiedadHandler(_mockDbContextFactory.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"nombrePropiedad\":\"Casa en el norte\"}");
        var context = new ToolExecutionContext();

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.Contains("DETALLES PROFUNDOS DE LA PROPIEDAD", result);
        Assert.Contains("Casa en el norte", result);
        Assert.Contains("120000", result);
        Assert.DoesNotContain("INFORMACIÓN PRIVADA", result); // Non copilot channel
    }

    [Fact]
    public async Task ExecuteAsync_WithCopilotChannel_IncludesPrivateInfo()
    {
        // Arrange
        var agentId = Guid.NewGuid();
        await SeedAgentAsync(new Agent { Id = agentId, Nombre = "Agente" });
        await SeedDatabaseAsync(new Property 
        { 
            Id = Guid.NewGuid(), 
            Titulo = "Departamento sur", 
            Operacion = "Alquiler", 
            TipoPropiedad = "Departamento", 
            Precio = 400,
            PorcentajeComision = 5,
            EsCaptacionPropia = true,
            AgenteId = agentId,
            CreatedByAgenteId = agentId,
            Descripcion = "Depto."
        });

        var handler = new ConsultarDetallesPropiedadHandler(_mockDbContextFactory.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"nombrePropiedad\":\"Departamento sur\"}");
        var context = new ToolExecutionContext { Channel = "Copilot", UserId = agentId };

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.Contains("INFORMACIÓN PRIVADA", result);
        Assert.Contains("Porcentaje de Comisión: 5", result);
        Assert.Contains("Es Captación Propia: Sí", result);
    }
}
