using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.Facebook.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.Messaging;

public class FacebookWebhookTests
{
    [Fact]
    public async Task PrepareAsync_ShouldSilence_WhenBotActivoFBIsFalse()
    {
        // Arrange
        var connection = new Microsoft.Data.Sqlite.SqliteConnection("DataSource=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<CrmDbContext>().UseSqlite(connection).Options;
        
        using (var setupContext = new CrmDbContext(options))
        {
            setupContext.Database.EnsureCreated();
            var agente = new Agent { Id = Guid.NewGuid(), Nombre = "Agente1", FacebookPageId = "page-id-1", Email = "a@a.com", IsFacebookAiEnabled = true };
            setupContext.Agents.Add(agente);
            setupContext.Contactos.Add(new Contacto 
            { 
                Id = Guid.NewGuid(), 
                FacebookSenderId = "psid-1", 
                AgenteId = agente.Id, 
                BotActivoFB = false // Inactive
            });
            await setupContext.SaveChangesAsync();
        }

        var loggerMock = new Mock<ILogger>();
        var httpClientFactoryMock = new Mock<IHttpClientFactory>();
        var dbFactoryMock = new Mock<IDbContextFactory<CrmDbContext>>();
        dbFactoryMock.Setup(f => f.CreateDbContextAsync(It.IsAny<CancellationToken>())).ReturnsAsync(() => new CrmDbContext(options));
        
        var builder = new FacebookContextBuilder(dbFactoryMock.Object, loggerMock.Object, httpClientFactoryMock.Object);
        
        // Act
        var result = await builder.PrepareAsync("psid-1", "page-id-1", CancellationToken.None);
        
        // Assert
        Assert.NotNull(result);
        Assert.True(result.ShouldSilence);
        Assert.False(result.Contacto?.BotActivoFB);
    }
}
