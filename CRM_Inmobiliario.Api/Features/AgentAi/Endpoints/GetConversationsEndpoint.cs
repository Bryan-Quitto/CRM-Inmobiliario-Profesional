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

public static class GetConversationsEndpoint
{
    public static void MapGetConversationsEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/conversations", HandleAsync)
           .RequireAuthorization();
    }

    private static async Task<IResult> HandleAsync(
        [FromQuery] int page,
        [FromQuery] int pageSize,
        HttpContext context,
        CrmDbContext dbContext,
        CancellationToken cancellationToken)
    {
        var userIdClaim = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var agentId))
        {
            return Results.Unauthorized();
        }

        page = page < 1 ? 1 : page;
        pageSize = pageSize < 1 ? 20 : pageSize;

        var conversations = await dbContext.AgentConversations
            .Where(c => c.AgentId == agentId)
            .OrderByDescending(c => c.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new
            {
                c.Id,
                c.Title,
                c.UpdatedAt
            })
            .ToListAsync(cancellationToken);

        return Results.Ok(conversations);
    }
}
