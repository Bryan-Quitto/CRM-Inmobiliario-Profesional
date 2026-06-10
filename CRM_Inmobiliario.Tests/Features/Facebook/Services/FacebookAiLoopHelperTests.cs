using System;
using System.Collections.Generic;
using System.Runtime.CompilerServices;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.Facebook.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace CRM_Inmobiliario.Tests.Features.Facebook.Services;

public class FacebookAiLoopHelperTests
{
    private readonly Mock<ILLMProvider> _mockProvider;
    private readonly Mock<IServiceScopeFactory> _mockScopeFactory;
    private readonly Mock<IServiceScope> _mockScope;
    private readonly Mock<IServiceProvider> _mockServiceProvider;
    private readonly Mock<ICoreAiToolExecutor> _mockToolExecutor;
    private readonly Mock<ILogger> _mockLogger;

    public FacebookAiLoopHelperTests()
    {
        _mockProvider = new Mock<ILLMProvider>();
        _mockScopeFactory = new Mock<IServiceScopeFactory>();
        _mockScope = new Mock<IServiceScope>();
        _mockServiceProvider = new Mock<IServiceProvider>();
        _mockToolExecutor = new Mock<ICoreAiToolExecutor>();
        _mockLogger = new Mock<ILogger>();

        _mockScopeFactory.Setup(f => f.CreateScope()).Returns(_mockScope.Object);
        _mockScope.Setup(s => s.ServiceProvider).Returns(_mockServiceProvider.Object);
        _mockServiceProvider.Setup(p => p.GetService(typeof(ICoreAiToolExecutor))).Returns(_mockToolExecutor.Object);
    }

    private async IAsyncEnumerable<AiResponseUpdate> YieldUpdates(params AiResponseUpdate[] updates)
    {
        foreach (var update in updates)
        {
            yield return update;
            await Task.Yield();
        }
    }

    [Fact]
    public async Task RunLoopAsync_WithSimpleText_ReturnsExpectedResponse()
    {
        // Arrange
        _mockProvider.Setup(p => p.StreamChatAsync(It.IsAny<List<AiMessage>>(), It.IsAny<List<AiToolDefinition>>(), null, It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(YieldUpdates(new AiResponseUpdate { TextUpdate = "Hola", TotalTokens = 10, InputTokens = 5, OutputTokens = 5 }, new AiResponseUpdate { TextUpdate = " Mundo" }));

        var aiMessages = new List<AiMessage>();

        // Act
        var result = await FacebookAiLoopHelper.RunLoopAsync(
            _mockProvider.Object,
            new List<(string Role, string Content)>(),
            aiMessages,
            new List<AiToolDefinition>(),
            "sender1",
            "page1",
            Guid.NewGuid(),
            "hello",
            _mockScopeFactory.Object,
            _mockLogger.Object,
            CancellationToken.None);

        // Assert
        Assert.Equal("Hola Mundo", result.FinalResponse);
        Assert.Equal(10, result.TotalTokens);
        Assert.Equal(5, result.InputTokens);
        Assert.Equal(5, result.OutputTokens);
    }

    [Fact]
    public async Task RunLoopAsync_WithToolCall_ExecutesToolAndContinues()
    {
        // Arrange
        var loopCount = 0;
        _mockProvider.Setup(p => p.StreamChatAsync(It.IsAny<List<AiMessage>>(), It.IsAny<List<AiToolDefinition>>(), null, It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(() => 
            {
                loopCount++;
                if (loopCount == 1)
                {
                    return YieldUpdates(new AiResponseUpdate 
                    { 
                        ToolCallUpdate = new AiToolCall { Id = "call_1", Name = "TestTool", Arguments = "{}" },
                        TotalTokens = 10
                    });
                }
                else
                {
                    return YieldUpdates(new AiResponseUpdate { TextUpdate = "Respuesta final", TotalTokens = 5 });
                }
            });

        _mockToolExecutor.Setup(e => e.HandleToolCallAsync(It.IsAny<AiToolCall>(), It.IsAny<ToolExecutionContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Tool result");

        var aiMessages = new List<AiMessage>();

        // Act
        var result = await FacebookAiLoopHelper.RunLoopAsync(
            _mockProvider.Object,
            new List<(string Role, string Content)>(),
            aiMessages,
            new List<AiToolDefinition>(),
            "sender1",
            "page1",
            Guid.NewGuid(),
            "hello",
            _mockScopeFactory.Object,
            _mockLogger.Object,
            CancellationToken.None);

        // Assert
        Assert.Equal("Respuesta final", result.FinalResponse);
        Assert.Equal(15, result.TotalTokens);
        _mockToolExecutor.Verify(e => e.HandleToolCallAsync(It.Is<AiToolCall>(t => t.Name == "TestTool"), It.IsAny<ToolExecutionContext>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RunLoopAsync_WithCriticalToolErrors_ActivatesCircuitBreaker()
    {
        // Arrange
        _mockProvider.Setup(p => p.StreamChatAsync(It.IsAny<List<AiMessage>>(), It.IsAny<List<AiToolDefinition>>(), null, It.IsAny<int?>(), It.IsAny<CancellationToken>()))
            .Returns(() => 
            {
                return YieldUpdates(new AiResponseUpdate 
                { 
                    ToolCallUpdate = new AiToolCall { Id = "call_err", Name = "BadTool", Arguments = "{}" }
                });
            });

        _mockToolExecutor.Setup(e => e.HandleToolCallAsync(It.IsAny<AiToolCall>(), It.IsAny<ToolExecutionContext>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync("Error Crítico: test error");

        var aiMessages = new List<AiMessage>();

        // Act
        var result = await FacebookAiLoopHelper.RunLoopAsync(
            _mockProvider.Object,
            new List<(string Role, string Content)>(),
            aiMessages,
            new List<AiToolDefinition>(),
            "sender1",
            "page1",
            Guid.NewGuid(),
            "hello",
            _mockScopeFactory.Object,
            _mockLogger.Object,
            CancellationToken.None);

        // Assert
        Assert.Contains("agente humano le ayudará", result.FinalResponse);
        _mockToolExecutor.Verify(e => e.HandleToolCallAsync(It.Is<AiToolCall>(t => t.Name == "SolicitarAsistenciaHumana"), It.IsAny<ToolExecutionContext>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
