using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using System;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.Messaging;

public class WhatsAppWebhookTests
{
    [Fact]
    public async Task PrepareContextAsync_ShouldSilence_WhenBotActivoWAIsFalse()
    {
        // Arrange
        var connection = new Microsoft.Data.Sqlite.SqliteConnection("DataSource=:memory:");
        connection.Open();
        var options = new DbContextOptionsBuilder<CrmDbContext>().UseSqlite(connection).Options;
        
        using (var setupContext = new CrmDbContext(options))
        {
            setupContext.Database.EnsureCreated();
            var agente = new Agent { Id = Guid.NewGuid(), Nombre = "Agente1", WhatsAppPhoneNumberId = "phone-id-1", Email = "a@a.com" };
            setupContext.Agents.Add(agente);
            setupContext.Contactos.Add(new Contacto 
            { 
                Id = Guid.NewGuid(), 
                Telefono = "+1234567890", 
                AgenteId = agente.Id, 
                BotActivoWA = false, // Inactive
                TransferenciaNotificada = true // So autoMsg is string.Empty (silence)
            });
            await setupContext.SaveChangesAsync();
        }

        var loggerMock = new Mock<ILogger<WhatsAppConversationManager>>();
        var promptBuilderMock = new Mock<IWhatsAppPromptBuilder>();
        promptBuilderMock.Setup(x => x.GetSystemPrompt(It.IsAny<bool>(), It.IsAny<string>(), It.IsAny<bool>())).Returns("SYSTEM");
        var configMock = new Mock<IConfiguration>();
        
        using (var context = new CrmDbContext(options))
        {
            var manager = new WhatsAppConversationManager(context, loggerMock.Object, promptBuilderMock.Object, configMock.Object, null!, null!);
            
            // Act
            var result = await manager.PrepareContextAsync("+1234567890", "Hello", "phone-id-1", CancellationToken.None);
            
            // Assert
            Assert.NotNull(result);
            Assert.NotNull(result.AutoResponse);
            Assert.Equal(string.Empty, result.AutoResponse); // Means silence mode
            Assert.False(result.Contacto?.BotActivoWA);
        }
    }
}
