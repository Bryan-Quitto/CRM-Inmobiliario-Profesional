using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Infrastructure.BackgroundServices;

public class TokenLimitResetJobTests
{
    private readonly DbContextOptions<CrmDbContext> _options;

    public TokenLimitResetJobTests()
    {
        var connection = new Microsoft.Data.Sqlite.SqliteConnection("DataSource=:memory:");
        connection.Open();

        _options = new DbContextOptionsBuilder<CrmDbContext>()
            .UseSqlite(connection)
            .Options;

        using var context = new CrmDbContext(_options);
        context.Database.EnsureCreated();
    }

    [Fact]
    public async Task ResetDailyLimitsAsync_ShouldReactivateBots_WhenLimitReached()
    {
        // Arrange
        var agenteId = Guid.NewGuid();
        using (var context = new CrmDbContext(_options))
        {
            context.Agents.Add(new Agent
            {
                Id = agenteId,
                Nombre = "Agente Test",
                Email = "test@example.com",
                Rol = "Agente",
                FechaCreacion = DateTimeOffset.UtcNow,
                Activo = true
            });
            context.Contactos.AddRange(
                new Contacto
                {
                    Id = Guid.NewGuid(),
                    AgenteId = agenteId,
                    Nombre = "Juan",
                    Apellido = "Perez",
                    Telefono = "123",
                    Origen = "WhatsApp",
                    EstadoIA_WA = "LimiteAlcanzado",
                    BotActivoWA = false,
                    EstadoIA_FB = null,
                    BotActivoFB = true
                },
                new Contacto
                {
                    Id = Guid.NewGuid(),
                    AgenteId = agenteId,
                    Nombre = "Maria",
                    Apellido = "Gomez",
                    Telefono = "456",
                    Origen = "Facebook",
                    EstadoIA_FB = "LimiteAlcanzado",
                    BotActivoFB = false,
                    EstadoIA_WA = null,
                    BotActivoWA = true
                },
                new Contacto
                {
                    Id = Guid.NewGuid(),
                    AgenteId = agenteId,
                    Nombre = "Pedro",
                    Apellido = "Diaz",
                    Telefono = "789",
                    Origen = "Manual",
                    EstadoIA_WA = "Escalado",
                    BotActivoWA = false,
                    EstadoIA_FB = "Escalado",
                    BotActivoFB = false
                }
            );
            await context.SaveChangesAsync();
        }

        var loggerMock = new Mock<ILogger<TokenLimitResetJob>>();

        // Act
        using (var context = new CrmDbContext(_options))
        {
            var job = new TokenLimitResetJob(context, loggerMock.Object);
            await job.ResetDailyLimitsAsync();
        }

        // Assert
        using (var context = new CrmDbContext(_options))
        {
            var contactos = await context.Contactos.ToListAsync();
            
            var juan = contactos.First(c => c.Nombre == "Juan");
            Assert.True(juan.BotActivoWA);
            Assert.Null(juan.EstadoIA_WA);
            Assert.True(juan.BotActivoFB);

            var maria = contactos.First(c => c.Nombre == "Maria");
            Assert.True(maria.BotActivoFB);
            Assert.Null(maria.EstadoIA_FB);
            Assert.True(maria.BotActivoWA);

            var pedro = contactos.First(c => c.Nombre == "Pedro");
            Assert.False(pedro.BotActivoWA);
            Assert.Equal("Escalado", pedro.EstadoIA_WA);
            Assert.False(pedro.BotActivoFB);
            Assert.Equal("Escalado", pedro.EstadoIA_FB);
        }
    }
}
