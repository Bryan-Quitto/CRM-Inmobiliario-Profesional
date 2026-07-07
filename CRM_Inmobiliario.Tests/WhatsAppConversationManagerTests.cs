using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using Microsoft.Extensions.AI;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace CRM_Inmobiliario.Tests
{
    public class WhatsAppMemoryProcessorTests
    {
        [Fact]
        public void ApplyNuevaBusqueda_ShouldTruncateHistory_AndRemoveToolMessages()
        {
            // Arrange
            var history = new List<ChatMessage>
            {
                new ChatMessage(ChatRole.System, "SYSTEM"),
                new ChatMessage(ChatRole.User, "User msg 1"),
                new ChatMessage(ChatRole.Assistant, "Assistant msg 1"),
                new ChatMessage(ChatRole.User, "User msg 2"),
                new ChatMessage(ChatRole.Assistant, "Assistant msg 2"),
                new ChatMessage(ChatRole.User, "User msg 3"),
                new ChatMessage(ChatRole.Assistant, "Assistant call tool") { Contents = { new FunctionCallContent("1", "BuscarPropiedades", new Dictionary<string, object?>()) } },
                new ChatMessage(ChatRole.Tool, "Tool result"),
                new ChatMessage(ChatRole.User, "User msg 4 - NUEVA_BUSQUEDA")
            };

            var processor = new WhatsAppMemoryProcessor(null!, null!, null!, null!); // Depending on what WhatsAppMemoryProcessor takes, if it takes ILogger etc.

            // Act
            processor.ApplyNuevaBusqueda(history);

            // Assert
            Assert.Equal(ChatRole.System, history[0].Role);
            
            Assert.Equal(5, history.Count);
            Assert.DoesNotContain(history, m => m.Role == ChatRole.Tool);
            Assert.DoesNotContain(history, m => m.Role == ChatRole.Assistant && m.Contents.Any(c => c is FunctionCallContent));
        }
    }
}
