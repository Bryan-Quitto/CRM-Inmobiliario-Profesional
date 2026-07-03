using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using Microsoft.Extensions.AI;
using System.Collections.Generic;
using System.Linq;
using Xunit;

namespace CRM_Inmobiliario.Tests
{
    public class WhatsAppConversationManagerTests
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

            var manager = new WhatsAppConversationManager(null!, null!, null!, null!, null!, null!, null!); // We don't need dependencies for this method if it doesn't use them.

            // Act
            manager.ApplyNuevaBusqueda(history);

            // Assert
            Assert.Equal(ChatRole.System, history[0].Role);
            
            // Should keep up to 6 messages, excluding tools. 
            // Original messages after system: 8
            // slidingWindow = take last 6 = from "User msg 2" to "User msg 4" (6 messages)
            // Tool messages are removed. "Assistant call tool" and "Tool result" are removed.
            // Remaining in sliding window: 4
            // Total history: 1 (system) + 4 = 5
            Assert.Equal(5, history.Count);
            Assert.DoesNotContain(history, m => m.Role == ChatRole.Tool);
            Assert.DoesNotContain(history, m => m.Role == ChatRole.Assistant && m.Contents.Any(c => c is FunctionCallContent));
        }
    }
}
