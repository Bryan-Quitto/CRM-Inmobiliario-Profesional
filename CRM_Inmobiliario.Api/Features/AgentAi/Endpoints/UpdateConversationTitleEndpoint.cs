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

public static class UpdateConversationTitleEndpoint
{
    public static void MapUpdateConversationTitleEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPut("/conversations/{id:guid}", HandleAsync)
           .RequireAuthorization();
    }

    public record UpdateConversationTitleRequest(string Title);

    private static async Task<IResult> HandleAsync(
        [FromRoute] Guid id,
        [FromBody] UpdateConversationTitleRequest request,
        HttpContext context,
        CrmDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var agentId))
        {
            return Results.Unauthorized();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return Results.BadRequest("El título no puede estar vacío.");
        }

        var rowsAffected = await dbContext.AgentConversations
            .Where(c => c.Id == id && c.AgentId == agentId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.Title, request.Title.Trim())
                .SetProperty(c => c.UpdatedAt, DateTime.UtcNow), 
                cancellationToken);

        if (rowsAffected == 0)
        {
            return Results.NotFound();
        }

        return Results.NoContent();
    }
}
