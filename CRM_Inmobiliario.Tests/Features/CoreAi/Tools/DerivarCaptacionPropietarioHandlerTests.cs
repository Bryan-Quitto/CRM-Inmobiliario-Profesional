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

public class DerivarCaptacionPropietarioHandlerTests
{
    private readonly Mock<ILogger<DerivarCaptacionPropietarioHandler>> _mockLogger;
    private readonly DbContextOptions<CrmDbContext> _dbContextOptions;
    private readonly Mock<IDbContextFactory<CrmDbContext>> _mockDbContextFactory;

    public DerivarCaptacionPropietarioHandlerTests()
    {
        _mockLogger = new Mock<ILogger<DerivarCaptacionPropietarioHandler>>();

        _dbContextOptions = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _mockDbContextFactory = new Mock<IDbContextFactory<CrmDbContext>>();
        _mockDbContextFactory.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new CrmDbContext(_dbContextOptions));
    }

    [Fact]
    public async Task ExecuteAsync_UpdatesExistingContactToOwner()
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

        var handler = new DerivarCaptacionPropietarioHandler(_mockDbContextFactory.Object, _mockLogger.Object);
        var args = JsonDocument.Parse("{\"nombre\":\"Juan\"}");
        var execContext = new ToolExecutionContext { ContactoId = contactoId, CustomerPhone = "+1234567" };

        // Act
        var result = await handler.ExecuteAsync(args, execContext);

        // Assert
        Assert.Contains("INSTRUCCIÓN PARA LA IA", result);

        await using var dbContext = new CrmDbContext(_dbContextOptions);
        var contact = await dbContext.Contactos.FindAsync(contactoId);
        Assert.NotNull(contact);
        Assert.True(contact.EsPropietario);
        Assert.False(contact.EsProspecto);
        Assert.False(contact.BotActivoWA);
        Assert.Equal("Derivado a Captacion", contact.EstadoIA_WA);
    }
}
