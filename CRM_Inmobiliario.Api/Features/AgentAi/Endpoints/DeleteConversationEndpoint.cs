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

public static class DeleteConversationEndpoint
{
    public static void MapDeleteConversationEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapDelete("/conversations/{conversationId:guid}", HandleAsync)
           .RequireAuthorization();
    }

    private static async Task<IResult> HandleAsync(
        [FromRoute] Guid conversationId,
        HttpContext context,
        CrmDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var agentId))
        {
            return Results.Unauthorized();
        }

        var rowsAffected = await dbContext.AgentConversations
            .Where(c => c.Id == conversationId && c.AgentId == agentId)
            .ExecuteDeleteAsync(cancellationToken);

        if (rowsAffected == 0)
        {
            return Results.NotFound();
        }

        return Results.NoContent();
    }
}
