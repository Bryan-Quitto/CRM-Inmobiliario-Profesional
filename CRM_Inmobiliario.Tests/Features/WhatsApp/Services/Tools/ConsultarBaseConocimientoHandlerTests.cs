using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using System;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Domain.Enums;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using CRM_Inmobiliario.Api.Features.Propiedades.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Pgvector;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.WhatsApp.Services.Tools;

public class ConsultarBaseConocimientoHandlerTests
{
    private readonly Mock<ILogger<ConsultarBaseConocimientoHandler>> _loggerMock;
    private readonly Mock<IPropertyEmbeddingService> _embeddingServiceMock;
    private readonly Mock<IDbContextFactory<CrmDbContext>> _dbContextFactoryMock;
    private readonly DbContextOptions<CrmDbContext> _options;

    public ConsultarBaseConocimientoHandlerTests()
    {
        _loggerMock = new Mock<ILogger<ConsultarBaseConocimientoHandler>>();
        _embeddingServiceMock = new Mock<IPropertyEmbeddingService>();

        _options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContextFactoryMock = new Mock<IDbContextFactory<CrmDbContext>>();
        _dbContextFactoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new CrmDbContext(_options));
    }

    private async Task SeedDatabaseAsync(CrmDbContext context)
    {
        var docId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        context.DocumentChunks.AddRange(
            new DocumentChunk
            {
                Id = Guid.NewGuid(),
                DocumentId = docId,
                Content = "Poltica pblica: Nuestros horarios de atencin son de 9 a 6.",
                Audience = DocumentAudience.Public,
                ChunkIndex = 0,
                CreatedAt = now,
                Embedding = new Vector(new float[] { 0.1f, 0.2f, 0.3f })
            },
            new DocumentChunk
            {
                Id = Guid.NewGuid(),
                DocumentId = docId,
                Content = "Poltica interna confidencial: Los descuentos mximos autorizados son del 10%.",
                Audience = DocumentAudience.Internal,
                ChunkIndex = 1,
                CreatedAt = now,
                Embedding = new Vector(new float[] { 0.1f, 0.2f, 0.3f })
            }
        );

        await context.SaveChangesAsync();
    }

    [Fact]
    public async Task ExecuteAsync_WhenChannelIsCopilot_ShouldIncludeInternalDocuments()
    {
        // Arrange
        using (var context = new CrmDbContext(_options))
        {
            await SeedDatabaseAsync(context);
        }

        var handler = new ConsultarBaseConocimientoHandler(
            _dbContextFactoryMock.Object,
            _loggerMock.Object,
            _embeddingServiceMock.Object);

        // Mock embedding to return dummy vector
        _embeddingServiceMock.Setup(s => s.GenerateEmbeddingAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new Vector(new float[] { 0.1f, 0.2f, 0.3f }));

        var args = JsonDocument.Parse("{\"query\": \"Poltica interna confidencial\"}");
        var executionContext = new ToolExecutionContext { Channel = "Copilot" };

        // Act
        var result = await handler.ExecuteAsync(args, executionContext);

        // Assert
        Assert.Contains("Poltica interna", result);
    }

    [Fact]
    public async Task ExecuteAsync_WhenChannelIsWhatsApp_ShouldExcludeInternalDocuments()
    {
        // Arrange
        using (var context = new CrmDbContext(_options))
        {
            await SeedDatabaseAsync(context);
        }

        var handler = new ConsultarBaseConocimientoHandler(
            _dbContextFactoryMock.Object,
            _loggerMock.Object,
            _embeddingServiceMock.Object);

        // Mock embedding to return dummy vector
        _embeddingServiceMock.Setup(s => s.GenerateEmbeddingAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
            .ReturnsAsync(new Vector(new float[] { 0.1f, 0.2f, 0.3f }));

        var args = JsonDocument.Parse("{\"query\": \"Poltica interna confidencial\"}");
        var executionContext = new ToolExecutionContext { Channel = "WhatsApp" };

        // Act
        var result = await handler.ExecuteAsync(args, executionContext);

        // Assert
        // Should NOT contain the internal document content
        Assert.DoesNotContain("Poltica interna", result);
        Assert.Contains("No encontr", result); // Or similar fallback message if no matches
    }

    [Fact]
    public async Task ExecuteAsync_WhenQueryIsEmpty_ShouldReturnError()
    {
        // Arrange
        var handler = new ConsultarBaseConocimientoHandler(
            _dbContextFactoryMock.Object,
            _loggerMock.Object,
            _embeddingServiceMock.Object);

        var args = JsonDocument.Parse("{\"query\": \"\"}");
        var executionContext = new ToolExecutionContext { Channel = "Copilot" };

        // Act
        var result = await handler.ExecuteAsync(args, executionContext);

        // Assert
        Assert.Contains("No se especific", result);
    }
}
