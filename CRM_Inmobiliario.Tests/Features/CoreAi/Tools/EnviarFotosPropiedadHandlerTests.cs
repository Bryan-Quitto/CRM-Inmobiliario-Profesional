using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using CRM_Inmobiliario.Api.Features.CoreAi.Tools;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.CoreAi.Tools;

public class EnviarFotosPropiedadHandlerTests
{
    private readonly Mock<IDbContextFactory<CrmDbContext>> _mockDbContextFactory;
    private readonly Mock<IPropertyGalleryAiDispatcher> _mockDispatcher;
    private readonly Mock<ILogger<EnviarFotosPropiedadHandler>> _mockLogger;

    public EnviarFotosPropiedadHandlerTests()
    {
        _mockDbContextFactory = new Mock<IDbContextFactory<CrmDbContext>>();
        _mockDispatcher = new Mock<IPropertyGalleryAiDispatcher>();
        _mockLogger = new Mock<ILogger<EnviarFotosPropiedadHandler>>();
    }

    [Fact]
    public async Task ExecuteAsync_MissingPropiedadId_ReturnsErrorMessage()
    {
        // Arrange
        var handler = new EnviarFotosPropiedadHandler(_mockDbContextFactory.Object, _mockDispatcher.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{}");
        var context = new ToolExecutionContext { Channel = "WhatsApp", ChannelIdentifier = "123" };

        // Act
        var result = await handler.ExecuteAsync(args, context, CancellationToken.None);

        // Assert
        Assert.Contains("Error: propiedadId es requerido", result);
    }

    [Fact]
    public async Task ExecuteAsync_MissingNombreSeccion_ReturnsErrorMessage()
    {
        // Arrange
        var handler = new EnviarFotosPropiedadHandler(_mockDbContextFactory.Object, _mockDispatcher.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"propiedadId\": \"" + Guid.NewGuid().ToString() + "\"}");
        var context = new ToolExecutionContext { Channel = "WhatsApp", ChannelIdentifier = "123" };

        // Act
        var result = await handler.ExecuteAsync(args, context, CancellationToken.None);

        // Assert
        Assert.Contains("Error: nombreSeccion es requerido", result);
    }

    [Fact]
    public async Task ExecuteAsync_MissingChannelIdentifier_ReturnsErrorMessage()
    {
        // Arrange
        var handler = new EnviarFotosPropiedadHandler(_mockDbContextFactory.Object, _mockDispatcher.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"propiedadId\": \"" + Guid.NewGuid().ToString() + "\", \"nombreSeccion\": \"Baños\"}");
        var context = new ToolExecutionContext { Channel = "WhatsApp", ChannelIdentifier = "" };

        // Act
        var result = await handler.ExecuteAsync(args, context, CancellationToken.None);

        // Assert
        Assert.Contains("Error: No se pudo obtener el identificador del canal", result);
    }

    [Fact]
    public async Task ExecuteAsync_ValidParameters_CallsDispatcher()
    {
        // Arrange
        var handler = new EnviarFotosPropiedadHandler(_mockDbContextFactory.Object, _mockDispatcher.Object, _mockLogger.Object);
        var propiedadId = Guid.NewGuid();
        var args = JsonDocument.Parse($"{{\"propiedadId\": \"{propiedadId}\", \"nombreSeccion\": \"Baños\", \"enviarTodas\": true, \"offset\": 2}}");
        var context = new ToolExecutionContext 
        { 
            Channel = "Facebook", 
            ChannelIdentifier = "456", 
            PhoneNumberId = "token123",
            ContactoId = Guid.NewGuid()
        };

        _mockDispatcher
            .Setup(d => d.DispatchGalleryAsync("Facebook", propiedadId, "Baños", true, 2, "456", "token123", context.ContactoId, It.IsAny<CancellationToken>()))
            .ReturnsAsync("Success");

        // Act
        var result = await handler.ExecuteAsync(args, context, CancellationToken.None);

        // Assert
        Assert.Equal("Success", result);
        _mockDispatcher.Verify(d => d.DispatchGalleryAsync("Facebook", propiedadId, "Baños", true, 2, "456", "token123", context.ContactoId, It.IsAny<CancellationToken>()), Times.Once);
    }
}
