using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Tools.ResumirHistorialContacto;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.WhatsApp.Tools.ResumirHistorialContacto;

public class ResumirHistorialContactoHandlerTests
{
    private readonly Mock<IDbContextFactory<CrmDbContext>> _dbContextFactoryMock;
    private readonly Mock<ILogger<ResumirHistorialContactoHandler>> _loggerMock;
    private readonly ResumirHistorialContactoHandler _handler;
    private readonly DbContextOptions<CrmDbContext> _options;

    public ResumirHistorialContactoHandlerTests()
    {
        _dbContextFactoryMock = new Mock<IDbContextFactory<CrmDbContext>>();
        _loggerMock = new Mock<ILogger<ResumirHistorialContactoHandler>>();

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

        _handler = new ResumirHistorialContactoHandler(_dbContextFactoryMock.Object, _loggerMock.Object);
        
        SeedDatabase();
    }

    private void SeedDatabase()
    {
        using var context = new CrmDbContext(_options);
        
        var agenteId = Guid.NewGuid();
        context.Agents.Add(new Agent
        {
            Id = agenteId,
            Nombre = "Admin Agent",
            Email = "admin@example.com",
            Rol = "Admin",
            FechaCreacion = DateTimeOffset.UtcNow
        });

        var contactoId = Guid.NewGuid();
        var contacto = new Contacto
        {
            Id = contactoId,
            AgenteId = agenteId,
            Nombre = "Juan Perez",
            Telefono = "5551234567",
            Email = "juan@example.com",
            EtapaEmbudo = "Interesado",
            EsProspecto = true,
            EsPropietario = false
        };

        context.Contactos.Add(contacto);

        context.Tasks.Add(new TaskItem
        {
            Id = Guid.NewGuid(),
            AgenteId = agenteId,
            ContactoId = contactoId,
            Titulo = "Llamada de seguimiento",
            TipoTarea = "Llamada",
            FechaInicio = DateTimeOffset.UtcNow.AddDays(-1),
            Estado = "Completado"
        });

        context.Interactions.Add(new Interaction
        {
            Id = Guid.NewGuid(),
            AgenteId = agenteId,
            ContactoId = contactoId,
            TipoInteraccion = "WhatsApp",
            Notas = "Cliente mostro mucho interes",
            FechaInteraccion = DateTimeOffset.UtcNow.AddDays(-2)
        });

        context.WhatsappConversations.Add(new WhatsappConversation
        {
            Id = Guid.NewGuid(),
            ContactoId = contactoId,
            Telefono = "5551234567",
            HistorialJson = "[{\"msg\": \"Hola\"}]",
            UltimaActualizacion = DateTimeOffset.UtcNow
        });

        context.SaveChanges();
    }

    [Fact]
    public void ToolName_IsResumirHistorialContacto()
    {
        // Assert
        Assert.Equal("ResumirHistorialContacto", _handler.ToolName);
    }

    [Fact]
    public async Task ExecuteAsync_WithValidSearchTerm_ReturnsContactSummary()
    {
        // Arrange
        var jsonString = "{\"searchTerm\": \"Juan\"}";
        using var jsonDoc = JsonDocument.Parse(jsonString);
        var context = new ToolExecutionContext 
        { 
            Channel = "WhatsApp",
            TriggerMessage = "Dime el historial de Juan",
            UserId = Guid.NewGuid()
        };

        // Act
        var result = await _handler.ExecuteAsync(jsonDoc, context, CancellationToken.None);

        // Assert
        Assert.Contains("Juan Perez", result);
        Assert.Contains("5551234567", result);
        Assert.Contains("Llamada de seguimiento", result);
        Assert.Contains("Cliente mostro mucho interes", result);
        Assert.Contains("Hola", result); 
    }

    [Fact]
    public async Task ExecuteAsync_WithValidPhoneSearchTerm_ReturnsContactSummary()
    {
        // Arrange
        var jsonString = "{\"searchTerm\": \"5551234567\"}";
        using var jsonDoc = JsonDocument.Parse(jsonString);
        var context = new ToolExecutionContext 
        { 
            Channel = "WhatsApp",
            TriggerMessage = "Dime el historial de 5551234567",
            UserId = Guid.NewGuid()
        };

        // Act
        var result = await _handler.ExecuteAsync(jsonDoc, context, CancellationToken.None);

        // Assert
        Assert.Contains("Juan Perez", result);
        Assert.Contains("5551234567", result);
    }

    [Fact]
    public async Task ExecuteAsync_WithNonExistentContact_ReturnsErrorMessage()
    {
        // Arrange
        var jsonString = "{\"searchTerm\": \"Pedro\"}";
        using var jsonDoc = JsonDocument.Parse(jsonString);
        var context = new ToolExecutionContext { Channel = "WhatsApp", UserId = Guid.NewGuid() };

        // Act
        var result = await _handler.ExecuteAsync(jsonDoc, context, CancellationToken.None);

        // Assert
        Assert.Contains("Contacto no encontrado", result);
    }
}
