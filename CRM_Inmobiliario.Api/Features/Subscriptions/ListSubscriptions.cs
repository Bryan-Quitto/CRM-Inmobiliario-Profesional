using System.Security.Claims;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Subscriptions;

public static class ListSubscriptionsFeature
{
    public static void MapListSubscriptions(this IEndpointRouteBuilder app)
    {
        app.MapGet("/admin/subscriptions", async (ClaimsPrincipal user, CrmDbContext context, CancellationToken ct) =>
        {
            var userId = CRM_Inmobiliario.Api.Extensions.ClaimsPrincipalExtensions.GetRequiredUserId(user);
            var reqAgente = await context.Agents.AsNoTracking().Select(a => new { a.Id, a.Rol }).FirstOrDefaultAsync(a => a.Id == userId, ct);
            if (reqAgente?.Rol != "Admin") return Results.Forbid();

            var now = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
            var dbAgents = await context.Agents
                .Include(a => a.Subscription)
                .AsNoTracking()
                .ToListAsync(ct);

            var subscriptions = dbAgents.Select(a => new {
                Id = a.Subscription?.Id ?? Guid.Empty,
                AgentId = a.Id,
                AgentName = a.Nombre + " " + a.Apellido,
                PlanTier = a.Subscription?.PlanTier ?? "None",
                Status = a.Subscription?.Status ?? "Expired",
                CurrentPeriodStart = a.Subscription?.CurrentPeriodStart ?? a.FechaCreacion,
                CurrentPeriodEnd = a.Subscription?.CurrentPeriodEnd ?? a.FechaCreacion,
                RemainingDays = a.Subscription != null ? (a.Subscription.CurrentPeriodEnd - now).Days : -999
            });

            return Results.Ok(subscriptions);
        })
        .WithTags("Subscriptions")
        .RequireAuthorization();
    }
}
