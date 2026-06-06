using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Endpoints;

public static class GetConversationMessagesEndpoint
{
    public static void MapGetConversationMessagesEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/conversations/{conversationId:guid}/messages", HandleAsync)
           .RequireAuthorization();
    }

    private static async Task<IResult> HandleAsync(
        [FromRoute] Guid conversationId,
        HttpContext context,
        CrmDbContext dbContext,
        CancellationToken cancellationToken,
        [FromQuery] int offset = 0,
        [FromQuery] int limit = 50)
    {
        var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var agentId))
        {
            return Results.Unauthorized();
        }

        limit = limit < 1 || limit > 100 ? 50 : limit;

        // Ensure user owns conversation
        var owns = await dbContext.AgentConversations
            .AnyAsync(c => c.Id == conversationId && c.AgentId == agentId, cancellationToken);

        if (!owns)
        {
            return Results.Forbid();
        }

        var messages = await dbContext.AgentMessages
            .Where(m => m.AgentConversationId == conversationId)
            .OrderByDescending(m => m.CreatedAt) // Order descending to get newest first
            .Skip(offset)
            .Take(limit)
            .Select(m => new
            {
                m.Id,
                m.Role,
                m.Content,
                m.CreatedAt
            })
            .ToListAsync(cancellationToken);

        // Reverse to return chronological order
        messages.Reverse();

        return Results.Ok(messages);
    }
}
