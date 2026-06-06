using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Tools.CrearTareaCRM;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.WhatsApp.Tools.CrearTareaCRM;

public class CrearTareaCRMHandlerTests
{
    private readonly Mock<IDbContextFactory<CrmDbContext>> _dbContextFactoryMock;
    private readonly Mock<ILogger<CrearTareaCRMHandler>> _loggerMock;
    private readonly CrearTareaCRMHandler _handler;
    private readonly DbContextOptions<CrmDbContext> _options;

    public CrearTareaCRMHandlerTests()
    {
        _dbContextFactoryMock = new Mock<IDbContextFactory<CrmDbContext>>();
        _loggerMock = new Mock<ILogger<CrearTareaCRMHandler>>();

        // Setting up InMemory Database for DbContextFactory
        _options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _dbContextFactoryMock
            .Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new CrmDbContext(_options));

        _dbContextFactoryMock
            .Setup(f => f.CreateDbContext())
            .Returns(() => new CrmDbContext(_options));

        _handler = new CrearTareaCRMHandler(_dbContextFactoryMock.Object, _loggerMock.Object);
        
        SeedDatabase();
    }

    private void SeedDatabase()
    {
        using var context = new CrmDbContext(_options);
        if (!context.Agents.Any())
        {
            context.Agents.Add(new Agent
            {
                Id = Guid.NewGuid(),
                Nombre = "Admin Agent",
                Email = "admin@example.com",
                Rol = "Admin",
                FechaCreacion = DateTimeOffset.UtcNow
            });
            context.SaveChanges();
        }
    }

    [Fact]
    public void ToolName_IsCrearTareaCRM()
    {
        // Assert
        Assert.Equal("CrearTareaCRM", _handler.ToolName);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidData_CreatesTaskAndReturnsSuccessMessage()
    {
        // Arrange
        var futureDate = DateTimeOffset.UtcNow.AddDays(1).ToString("O");
        var jsonString = $"{{\"titulo\": \"Llamar al cliente\", \"descripcion\": \"Llamar para confirmar visita\", \"fechaProgramada\": \"{futureDate}\"}}";
        using var jsonDoc = JsonDocument.Parse(jsonString);
        var context = new ToolExecutionContext 
        { 
            Channel = "WhatsApp",
            TriggerMessage = "Agendar tarea",
            UserId = Guid.NewGuid()
        };

        // Act
        var result = await _handler.ExecuteAsync(jsonDoc, context, CancellationToken.None);

        // Assert
        Assert.Contains("Tarea creada exitosamente", result);
        
        // Verify in DB
        using var dbContext = new CrmDbContext(_options);
        var task = await dbContext.Tasks.FirstOrDefaultAsync();
        Assert.NotNull(task);
        Assert.Equal("Llamar al cliente", task.Titulo);
        Assert.Equal("Llamar para confirmar visita", task.Descripcion);
        Assert.Equal("Programada por IA", task.TipoTarea);
    }

    [Fact]
    public async Task ExecuteAsync_MissingTitle_ReturnsErrorMessage()
    {
        // Arrange
        var futureDate = DateTimeOffset.UtcNow.AddDays(1).ToString("O");
        var jsonString = $"{{\"descripcion\": \"Llamar para confirmar visita\", \"fechaProgramada\": \"{futureDate}\"}}";
        using var jsonDoc = JsonDocument.Parse(jsonString);
        var context = new ToolExecutionContext { Channel = "WhatsApp", UserId = Guid.NewGuid() };

        // Act
        var result = await _handler.ExecuteAsync(jsonDoc, context, CancellationToken.None);

        // Assert
        Assert.Equal("Error: Título y descripción son obligatorios.", result);
    }

    [Fact]
    public async Task ExecuteAsync_MissingDescription_ReturnsErrorMessage()
    {
        // Arrange
        var futureDate = DateTimeOffset.UtcNow.AddDays(1).ToString("O");
        var jsonString = $"{{\"titulo\": \"Llamar al cliente\", \"fechaProgramada\": \"{futureDate}\"}}";
        using var jsonDoc = JsonDocument.Parse(jsonString);
        var context = new ToolExecutionContext { Channel = "WhatsApp", UserId = Guid.NewGuid() };

        // Act
        var result = await _handler.ExecuteAsync(jsonDoc, context, CancellationToken.None);

        // Assert
        Assert.Equal("Error: Título y descripción son obligatorios.", result);
    }
}
