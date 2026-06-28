using System;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.AgentAi.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Endpoints;

public static class StreamChatEndpoint
{
    public static void MapStreamChatEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/stream", HandleAsync)
           .RequireAuthorization();
    }

    private static async Task HandleAsync(
        [FromBody] ChatRequest request,
        HttpContext context,
        AgentAiService aiService,
        CrmDbContext dbContext,
        AgentTitleGeneratorService titleService,
        CancellationToken cancellationToken)
    {
        var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var agentId))
        {
            context.Response.StatusCode = 401;
            return;
        }

        Guid conversationId = request.ConversationId ?? Guid.NewGuid();
        bool isFirstMessage = false;

        var conversation = await dbContext.AgentConversations.FindAsync(new object[] { conversationId }, cancellationToken);
        if (conversation == null)
        {
            conversation = new AgentConversation
            {
                Id = conversationId,
                AgentId = agentId,
                CreatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)),
                UpdatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5))
            };
            dbContext.AgentConversations.Add(conversation);
            isFirstMessage = true;
        }
        else
        {
            conversation.UpdatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
        }

        var userMessage = new AgentMessage
        {
            Id = Guid.NewGuid(),
            AgentConversationId = conversationId,
            Role = "user",
            Content = request.Message,
            CreatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5))
        };
        dbContext.AgentMessages.Add(userMessage);

        await dbContext.SaveChangesAsync(cancellationToken);

        context.Response.Headers.Append("Content-Type", "text/event-stream");
        context.Response.Headers.Append("Cache-Control", "no-cache");

        var responseBuilder = new System.Text.StringBuilder();

        try
        {
            await foreach (var chunk in aiService.StreamResponseAsync(agentId, conversationId, request.Message, request.FocusedContext, cancellationToken))
            {
                responseBuilder.Append(chunk);
                var encodedChunk = chunk.Replace("\n", "\\n"); // Or proper JSON encoding if needed
                // For simple SSE:
                await context.Response.WriteAsync($"data: {encodedChunk}\n\n", cancellationToken);
                await context.Response.Body.FlushAsync(cancellationToken);
            }
        }
        catch (OperationCanceledException)
        {
            // El cliente cerró la conexión o canceló el stream.
            // Continuamos para guardar el mensaje parcial que se haya generado.
        }

        string cleanMessage = Regex.Replace(responseBuilder.ToString(), @"\[SystemAction:.*?\]", string.Empty).Trim();

        var assistantMessage = new AgentMessage
        {
            Id = Guid.NewGuid(),
            AgentConversationId = conversationId,
            Role = "assistant",
            Content = cleanMessage,
            CreatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5))
        };
        dbContext.AgentMessages.Add(assistantMessage);
        await dbContext.SaveChangesAsync(CancellationToken.None);

        if (isFirstMessage)
        {
            await context.Response.WriteAsync($"data: [SystemAction: ConversationId={conversationId}]\n\n", CancellationToken.None);
            await context.Response.Body.FlushAsync(CancellationToken.None);
            _ = Task.Run(() => titleService.GenerateTitleAsync(agentId, conversationId, request.Message, CancellationToken.None));
        }

        if (!cancellationToken.IsCancellationRequested)
        {
            await context.Response.WriteAsync("data: [DONE]\n\n", CancellationToken.None);
            await context.Response.Body.FlushAsync(CancellationToken.None);
        }
    }

    public class FocusedContextDto
    {
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public class ChatRequest
    {
        public Guid? ConversationId { get; set; }
        public string Message { get; set; } = string.Empty;
        public FocusedContextDto? FocusedContext { get; set; }
    }
}
