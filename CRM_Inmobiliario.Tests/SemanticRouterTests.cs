using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using CRM_Inmobiliario.Api.Features.WhatsApp;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using CRM_Inmobiliario.Api.Features.AI.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using System.Net.Http;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Domain.Entities;

namespace CRM_Inmobiliario.Tests
{
    public class SemanticRouterTests
    {
        private WhatsAppAiService CreateServiceWithMockRouter(string routerResponse, Mock<IWhatsAppConversationManager> conversationManagerMock)
        {
            var loggerMock = new Mock<ILogger<WhatsAppAiService>>();
            var promptBuilderMock = new Mock<IWhatsAppPromptBuilder>();
            var toolExecutorMock = new Mock<IWhatsAppToolExecutor>();
            var messageSenderMock = new Mock<IWhatsAppMessageSender>();
            var httpClientFactoryMock = new Mock<IHttpClientFactory>();
            
            var options = new DbContextOptionsBuilder<CrmDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var dbContext = new CrmDbContext(options);
            
            var settingsMock = new Mock<Microsoft.Extensions.Options.IOptions<CRM_Inmobiliario.Api.Features.Shared.Settings.LLMSettings>>();
            var providerFactoryMock = new Mock<LLMProviderFactory>(httpClientFactoryMock.Object, settingsMock.Object);
            var providerMock = new Mock<ILLMProvider>();
            
            var geminiApiClientMock = new Mock<IGeminiApiClient>();
            var datasetProviderMock = new Mock<IDatasetProvider>();

            // Setup provider mock to return the routerResponse
            var asyncUpdates = new List<AiResponseUpdate> 
            {
                new AiResponseUpdate { TextUpdate = routerResponse, FinishReason = "stop" }
            };
            
            #pragma warning disable CS1998 // Async method lacks 'await' operators and will run synchronously
            async IAsyncEnumerable<AiResponseUpdate> GetStream()
            {
                foreach(var update in asyncUpdates)
                {
                    yield return update;
                }
            }
            #pragma warning restore CS1998
            
            providerMock.Setup(p => p.StreamChatAsync(
                It.IsAny<List<AiMessage>>(), 
                It.IsAny<List<AiToolDefinition>>(), 
                It.IsAny<string>(), 
                It.IsAny<int?>(),
                It.IsAny<System.Threading.CancellationToken>()))
                .Returns(GetStream());
                
            providerFactoryMock.Setup(f => f.GetProvider(It.IsAny<string>(), It.IsAny<string>()))
                               .Returns(providerMock.Object);

            return new WhatsAppAiService(
                loggerMock.Object,
                promptBuilderMock.Object,
                toolExecutorMock.Object,
                messageSenderMock.Object,
                conversationManagerMock.Object,
                httpClientFactoryMock.Object,
                dbContext,
                providerFactoryMock.Object,
                geminiApiClientMock.Object,
                datasetProviderMock.Object
            );
        }

        [Theory]
        [InlineData("NUEVA_BUSQUEDA", true)]
        [InlineData("CAMBIO_TEMA", true)]
        [InlineData("CONTINUACION", false)]
        [InlineData("algo mas NUEVA_BUSQUEDA", true)]
        [InlineData("CONTINUACION con mas texto", false)]
        public async Task SemanticRouter_EvaluatesIntentsCorrectly(string llmResponse, bool shouldApplyNuevaBusqueda)
        {
            // Arrange
            var conversationManagerMock = new Mock<IWhatsAppConversationManager>();
            
            var history = new List<ChatMessage>
            {
                new ChatMessage(ChatRole.System, "system"),
                new ChatMessage(ChatRole.User, "hola"),
                new ChatMessage(ChatRole.Assistant, "hola")
            };
            
            var context = new WhatsAppContext(
                new Contacto { Id = Guid.NewGuid() },
                null!,
                history,
                null!,
                false
            );
            
            conversationManagerMock.Setup(c => c.PrepareContextAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<string>()))
                                   .ReturnsAsync(context);
                                   
            var service = CreateServiceWithMockRouter(llmResponse, conversationManagerMock);

            // Act
            await service.ProcessIncomingMessageAsync("1234567890", "test message", "phone-id");

            // Assert
            if (shouldApplyNuevaBusqueda)
            {
                conversationManagerMock.Verify(c => c.ApplyNuevaBusqueda(history), Times.Once);
            }
            else
            {
                conversationManagerMock.Verify(c => c.ApplyNuevaBusqueda(It.IsAny<List<ChatMessage>>()), Times.Never);
            }
        }
    }
}
