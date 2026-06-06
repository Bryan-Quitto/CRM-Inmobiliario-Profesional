using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.AgentAi.Tools;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.AgentAi.Tools;

public class NavegacionDirectaHandlerTests
{
    private readonly Mock<IDbContextFactory<CrmDbContext>> _dbContextFactoryMock;
    private readonly Mock<ILogger<NavegacionDirectaHandler>> _loggerMock;
    private readonly NavegacionDirectaHandler _handler;

    public NavegacionDirectaHandlerTests()
    {
        _dbContextFactoryMock = new Mock<IDbContextFactory<CrmDbContext>>();
        _loggerMock = new Mock<ILogger<NavegacionDirectaHandler>>();

        // Setting up InMemory Database for DbContextFactory
        var options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContextFactoryMock
            .Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new CrmDbContext(options));

        _dbContextFactoryMock
            .Setup(f => f.CreateDbContext())
            .Returns(() => new CrmDbContext(options));

        _handler = new NavegacionDirectaHandler(_dbContextFactoryMock.Object, _loggerMock.Object);
    }

    [Fact]
    public void ToolName_IsNavegacionDirecta()
    {
        // Assert
        Assert.Equal("NavegacionDirecta", _handler.ToolName);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidDestino_ReturnsRedirectToken()
    {
        // Arrange
        var jsonString = "{\"destino\": \"/dashboard/propiedades\"}";
        using var jsonDoc = JsonDocument.Parse(jsonString);
        var context = new ToolExecutionContext 
        { 
            Channel = "Copilot",
            TriggerMessage = "Llévame a propiedades",
            UserId = Guid.NewGuid()
        };

        // Act
        var result = await _handler.ExecuteAsync(jsonDoc, context, CancellationToken.None);

        // Assert
        Assert.Contains("[SystemAction: RedirectTo=/dashboard/propiedades]", result);
        Assert.Contains("Redirigiendo al usuario", result);
    }

    [Fact]
    public async Task ExecuteAsync_WithEmptyDestino_ReturnsErrorMessage()
    {
        // Arrange
        var jsonString = "{\"destino\": \"\"}";
        using var jsonDoc = JsonDocument.Parse(jsonString);
        var context = new ToolExecutionContext 
        { 
            Channel = "Copilot",
            TriggerMessage = "test message",
            UserId = Guid.NewGuid()
        };

        // Act
        var result = await _handler.ExecuteAsync(jsonDoc, context, CancellationToken.None);

        // Assert
        Assert.Equal("Error: No se proporcionó un destino válido.", result);
    }

    [Fact]
    public async Task ExecuteAsync_WithoutDestino_ReturnsErrorMessage()
    {
        // Arrange
        var jsonString = "{}";
        using var jsonDoc = JsonDocument.Parse(jsonString);
        var context = new ToolExecutionContext 
        { 
            Channel = "Copilot",
            TriggerMessage = "test message",
            UserId = Guid.NewGuid()
        };

        // Act
        var result = await _handler.ExecuteAsync(jsonDoc, context, CancellationToken.None);

        // Assert
        Assert.Equal("Error: No se proporcionó un destino válido.", result);
    }
}
