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

public class SolicitarAsistenciaHumanaHandlerTests
{
    private readonly Mock<ILogger<SolicitarAsistenciaHumanaHandler>> _mockLogger;
    private readonly DbContextOptions<CrmDbContext> _dbContextOptions;
    private readonly Mock<IDbContextFactory<CrmDbContext>> _mockDbContextFactory;

    public SolicitarAsistenciaHumanaHandlerTests()
    {
        _mockLogger = new Mock<ILogger<SolicitarAsistenciaHumanaHandler>>();

        _dbContextOptions = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _mockDbContextFactory = new Mock<IDbContextFactory<CrmDbContext>>();
        _mockDbContextFactory.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new CrmDbContext(_dbContextOptions));
    }

    [Fact]
    public async Task ExecuteAsync_WithExistingContact_ScalesToHuman()
    {
        // Arrange
        var contactoId = Guid.NewGuid();
        var agentId = Guid.NewGuid();
        await using (var context = new CrmDbContext(_dbContextOptions))
        {
            context.Contactos.Add(new Contacto { Id = contactoId, Telefono = "+1234567", Nombre = "Juan", AgenteId = agentId });
            context.Agents.Add(new Agent { Id = agentId, Rol = "Admin", Nombre = "Agente", Apellido = "X" });
            await context.SaveChangesAsync();
        }

        var mockPushNotificationService = new Mock<CRM_Inmobiliario.Api.Features.PushNotifications.Services.IPushNotificationService>();
        var handler = new SolicitarAsistenciaHumanaHandler(_mockDbContextFactory.Object, _mockLogger.Object, mockPushNotificationService.Object);
        var args = JsonDocument.Parse("{\"motivo\":\"Estoy muy molesto\"}");
        var execContext = new ToolExecutionContext { ContactoId = contactoId, ChannelIdentifier = "+1234567" };

        // Act
        var result = await handler.ExecuteAsync(args, execContext);

        // Assert
        Assert.Contains("Solicitud de asistencia enviada", result);

        await using var dbContext = new CrmDbContext(_dbContextOptions);
        var contact = await dbContext.Contactos.FindAsync(contactoId);
        Assert.NotNull(contact);
        Assert.Contains("Escalamiento: Estoy muy molesto", contact.Notas);
        Assert.False(contact.BotActivoWA);
        Assert.Equal("Escalado", contact.EstadoIA_WA);

        mockPushNotificationService.Verify(s => s.SendNotificationToAgentAsync(
            agentId,
            "🚨 Asistencia Humana Solicitada",
            It.Is<string>(msg => msg.Contains("Estoy muy molesto")),
            $"/contactos/{contactoId}",
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
