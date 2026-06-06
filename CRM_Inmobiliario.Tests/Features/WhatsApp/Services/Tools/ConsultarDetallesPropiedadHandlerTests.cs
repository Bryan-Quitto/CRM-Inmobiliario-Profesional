using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;

namespace CRM_Inmobiliario.Tests.Features.WhatsApp.Services.Tools;

public class ConsultarDetallesPropiedadHandlerTests
{
    private readonly DbContextOptions<CrmDbContext> _options;

    public ConsultarDetallesPropiedadHandlerTests()
    {
        _options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
    }

    [Fact]
    public async Task ExecuteAsync_WhenChannelIsCopilot_ReturnsPrivateDetails()
    {
        // Arrange
        var dbContextFactoryMock = new Mock<IDbContextFactory<CrmDbContext>>();
        dbContextFactoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new CrmDbContext(_options));

        var loggerMock = new Mock<ILogger<ConsultarDetallesPropiedadHandler>>();
        var handler = new ConsultarDetallesPropiedadHandler(dbContextFactoryMock.Object, loggerMock.Object);

        var propertyId = Guid.NewGuid();
        using (var context = new CrmDbContext(_options))
        {
            context.Properties.Add(new Property
            {
                Id = propertyId,
                Titulo = "Casa de lujo",
                Descripcion = "Hermosa casa",
                TipoPropiedad = "Casa",
                Operacion = "Venta",
                Direccion = "Av Siempre Viva",
                Sector = "Norte",
                Ciudad = "Springfield",
                PorcentajeComision = 7.5m,
                PropietarioId = Guid.NewGuid()
            });
            await context.SaveChangesAsync();
        }

        var args = JsonDocument.Parse($"{{\"propiedadId\": \"{propertyId}\"}}");
        var executionContext = new ToolExecutionContext 
        { 
            Channel = "Copilot",
            TriggerMessage = "test"
        };

        // Act
        var result = await handler.ExecuteAsync(args, executionContext);

        // Assert
        Assert.Contains("Porcentaje de Comisión", result);
        Assert.Contains("ID Dueño / Propietario", result);
    }

    [Fact]
    public async Task ExecuteAsync_WhenChannelIsWhatsApp_DoesNotReturnPrivateDetails()
    {
        // Arrange
        var dbContextFactoryMock = new Mock<IDbContextFactory<CrmDbContext>>();
        dbContextFactoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => new CrmDbContext(_options));

        var loggerMock = new Mock<ILogger<ConsultarDetallesPropiedadHandler>>();
        var handler = new ConsultarDetallesPropiedadHandler(dbContextFactoryMock.Object, loggerMock.Object);

        var propertyId = Guid.NewGuid();
        using (var context = new CrmDbContext(_options))
        {
            context.Properties.Add(new Property
            {
                Id = propertyId,
                Titulo = "Casa de lujo",
                Descripcion = "Hermosa casa",
                TipoPropiedad = "Casa",
                Operacion = "Venta",
                Direccion = "Av Siempre Viva",
                Sector = "Norte",
                Ciudad = "Springfield",
                PorcentajeComision = 7.5m,
                PropietarioId = Guid.NewGuid()
            });
            await context.SaveChangesAsync();
        }

        var args = JsonDocument.Parse($"{{\"propiedadId\": \"{propertyId}\"}}");
        var executionContext = new ToolExecutionContext 
        { 
            Channel = "WhatsApp",
            TriggerMessage = "test"
        };

        // Act
        var result = await handler.ExecuteAsync(args, executionContext);

        // Assert
        Assert.DoesNotContain("Porcentaje de Comisión", result);
        Assert.DoesNotContain("ID Dueño / Propietario", result);
    }
}
