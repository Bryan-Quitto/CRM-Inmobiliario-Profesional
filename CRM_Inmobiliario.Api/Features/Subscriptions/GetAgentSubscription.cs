using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Subscriptions;

public static class GetAgentSubscriptionFeature
{
    public static void MapGetAgentSubscription(this IEndpointRouteBuilder app)
    {
        app.MapGet("/subscriptions/me", async (ClaimsPrincipal user, CrmDbContext context, CancellationToken ct) =>
        {
            var userId = user.GetRequiredUserId();
            var agent = await context.Agents
                .Include(a => a.Subscription)
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == userId, ct);

            if (agent is null) return Results.NotFound();

            if (agent.Rol == "Admin")
            {
                return Results.Ok(new 
                {
                    Id = Guid.Empty,
                    AgentId = agent.Id,
                    PlanTier = "Pro",
                    Status = "Active",
                    CurrentPeriodStart = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)),
                    CurrentPeriodEnd = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).AddYears(10)
                });
            }

            if (agent.Subscription is not null)
            {
                return Results.Ok(agent.Subscription);
            }

            return Results.Ok(new 
            {
                Id = Guid.Empty,
                AgentId = agent.Id,
                PlanTier = "None",
                Status = "Expired",
                CurrentPeriodStart = agent.FechaCreacion,
                CurrentPeriodEnd = agent.FechaCreacion
            });
        })
        .WithTags("Subscriptions")
        .RequireAuthorization();
    }
}
