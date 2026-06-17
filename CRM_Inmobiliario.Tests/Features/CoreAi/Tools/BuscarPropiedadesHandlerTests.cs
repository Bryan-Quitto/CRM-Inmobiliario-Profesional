using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.Propiedades.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Tools;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Pgvector;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.CoreAi.Tools;

public class BuscarPropiedadesHandlerTests
{
    private readonly Mock<IPropertyEmbeddingService> _mockEmbeddingService;
    private readonly Mock<ILogger<BuscarPropiedadesHandler>> _mockLogger;
    private readonly DbContextOptions<CrmDbContext> _dbContextOptions;
    private readonly Mock<IDbContextFactory<CrmDbContext>> _mockDbContextFactory;

    public BuscarPropiedadesHandlerTests()
    {
        _mockEmbeddingService = new Mock<IPropertyEmbeddingService>();
        _mockLogger = new Mock<ILogger<BuscarPropiedadesHandler>>();

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

    [Fact]
    public async Task ExecuteAsync_WithMatchingProperties_ReturnsMinifiedJsonForCopilot()
    {
        // Arrange
        var handler = new BuscarPropiedadesHandler(_mockDbContextFactory.Object, _mockLogger.Object, _mockEmbeddingService.Object);

        await SeedDatabaseAsync(new Property
        {
            Id = Guid.NewGuid(),
            Titulo = "Casa hermosa",
            Precio = 150000,
            Sector = "Norte",
            Ciudad = "Quito",
            Direccion = "Calle 1",
            Habitaciones = 3,
            Banos = 2,
            Estacionamientos = 1,
            AniosAntiguedad = 5,
            AreaTotal = 150,
            Operacion = "Venta",
            TipoPropiedad = "Casa",
            EstadoComercial = "Disponible",
            Descripcion = "Una casa muy hermosa en el norte",
            VectorEmbedding = new Vector(new float[1536]), // Aunque EF InMemory lo ignore, lo ponemos
            GeminiEmbedding = new Vector(new float[768])
        });

        _mockEmbeddingService.Setup(s => s.GenerateEmbeddingAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new Vector(new float[1536]));

        var args = JsonDocument.Parse("{\"query\":\"hermosa\"}");
        var context = new ToolExecutionContext 
        { 
            Channel = "Copilot", 
            ChannelIdentifier = "1234567890", 
            PhoneNumberId = "123" 
        };

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.NotNull(result);
        Assert.StartsWith("[", result); // Debe ser un JSON array para Copilot
        Assert.Contains("Casa hermosa", result);
        Assert.Contains("150000", result);
    }

    [Fact]
    public async Task ExecuteAsync_WithNoMatchingProperties_ReturnsNotFoundMessage()
    {
        // Arrange
        var handler = new BuscarPropiedadesHandler(_mockDbContextFactory.Object, _mockLogger.Object, _mockEmbeddingService.Object);

        await SeedDatabaseAsync(new Property
        {
            Id = Guid.NewGuid(),
            Titulo = "Departamento céntrico",
            Precio = 80000,
            Sector = "Centro",
            Ciudad = "Quito",
            Direccion = "Calle 2",
            Habitaciones = 2,
            Banos = 1,
            Estacionamientos = 0,
            AniosAntiguedad = 10,
            AreaTotal = 80,
            Operacion = "Venta",
            TipoPropiedad = "Departamento",
            EstadoComercial = "Disponible",
            Descripcion = "Un departamento en el centro",
            VectorEmbedding = new Vector(new float[1536]),
            GeminiEmbedding = new Vector(new float[768])
        });

        _mockEmbeddingService.Setup(s => s.GenerateEmbeddingAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new Vector(new float[1536]));

        var args = JsonDocument.Parse("{\"query\":\"playa\"}"); // "playa" no está en el título ni descripción y no hay semántica
        var context = new ToolExecutionContext 
        { 
            Channel = "Copilot", 
            ChannelIdentifier = "1234567890", 
            PhoneNumberId = "123" 
        };

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("No encontré propiedades que coincidan con tu búsqueda semántica.", result);
    }

    [Fact]
    public async Task ExecuteAsync_WithFilters_AppliesFiltersCorrectly()
    {
        // Arrange
        var handler = new BuscarPropiedadesHandler(_mockDbContextFactory.Object, _mockLogger.Object, _mockEmbeddingService.Object);

        await SeedDatabaseAsync(
            new Property
            {
                Id = Guid.NewGuid(),
                Titulo = "Casa en venta barata",
                Precio = 50000, // Menor o igual a presupuesto
                Operacion = "Venta",
                Habitaciones = 3, // Mayor o igual a habitacionesMinimas
                EstadoComercial = "Disponible",
                Descripcion = "casa barata"
            },
            new Property
            {
                Id = Guid.NewGuid(),
                Titulo = "Casa en venta cara",
                Precio = 200000, // Mayor a presupuesto, debería filtrarse
                Operacion = "Venta",
                Habitaciones = 4,
                EstadoComercial = "Disponible",
                Descripcion = "casa cara"
            }
        );

        _mockEmbeddingService.Setup(s => s.GenerateEmbeddingAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new Vector(new float[1536]));

        var argsJson = @"{
            ""query"": ""casa"",
            ""presupuestoMaximo"": 100000,
            ""habitacionesMinimas"": 2
        }";
        var args = JsonDocument.Parse(argsJson);
        var context = new ToolExecutionContext 
        { 
            Channel = "Copilot", 
            ChannelIdentifier = "1234567890", 
            PhoneNumberId = "123" 
        };

        // Act
        var result = await handler.ExecuteAsync(args, context);

        // Assert
        Assert.NotNull(result);
        Assert.Contains("Casa en venta barata", result);
        Assert.DoesNotContain("Casa en venta cara", result);
    }
}
