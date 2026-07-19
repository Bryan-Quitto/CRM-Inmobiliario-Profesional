using System.Security.Claims;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Subscriptions;

public static class ActivateSubscriptionFeature
{
    public record ActivateSubscriptionRequest(Guid AgentId, string PlanTier, string PaymentNotes, int Months = 1);

    public static void MapActivateSubscription(this IEndpointRouteBuilder app)
    {
        app.MapPost("/admin/subscriptions/activate", async ([FromBody] ActivateSubscriptionRequest request, ClaimsPrincipal user, CrmDbContext context, CancellationToken ct) =>
        {
            var userId = CRM_Inmobiliario.Api.Extensions.ClaimsPrincipalExtensions.GetRequiredUserId(user);
            var reqAgente = await context.Agents.AsNoTracking().Select(a => new { a.Id, a.Rol }).FirstOrDefaultAsync(a => a.Id == userId, ct);
            if (reqAgente?.Rol != "Admin") return Results.Forbid();

            var now = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
            var agent = await context.Agents.Include(a => a.Subscription).FirstOrDefaultAsync(a => a.Id == request.AgentId, ct);

            if (agent is null) return Results.NotFound("Agent not found");

            if (agent.Subscription is null)
            {
                agent.Subscription = new Domain.Entities.Subscription { AgentId = request.AgentId };
                context.Subscriptions.Add(agent.Subscription);
            }

            agent.Subscription.PlanTier = request.PlanTier;
            
            // Calculate new end date
            // Calculate new end date
            var newEnd = now;
            // If active (future) OR within the 1-day grace period (PastDue), append to CurrentPeriodEnd
            // This prevents users from getting 1 free day if they pay during grace period
            if ((agent.Subscription.Status == "Active" || agent.Subscription.Status == "PastDue") && 
                agent.Subscription.CurrentPeriodEnd >= now.AddDays(-1))
            {
                newEnd = agent.Subscription.CurrentPeriodEnd;
            }
            newEnd = newEnd.AddDays(30 * request.Months);

            // If they were completely expired (more than 1 day late), their new cycle started from 'now'.
            // We should update their CurrentPeriodStart to 'now' to reflect the new cycle.
            if (agent.Subscription.CurrentPeriodEnd < now.AddDays(-1))
            {
                agent.Subscription.CurrentPeriodStart = now;
            }

            agent.Subscription.Status = "Active";
            agent.Subscription.CurrentPeriodEnd = newEnd;
            agent.Subscription.UpdatedAt = now;
            
            if (request.PlanTier == "Pro")
            {
                agent.GlobalStorageBytesLimit = 15000000000; // 15 GB acumulado
                agent.MonthlyStorageBytesLimit = 3000000000;  // 3 GB/mes de ingesta
                agent.MonthlyStorageUploadsLimit = 6000;
            }
            else
            {
                agent.GlobalStorageBytesLimit = 5000000000;  // 5 GB acumulado
                agent.MonthlyStorageBytesLimit = 1000000000; // 1 GB/mes de ingesta
                agent.MonthlyStorageUploadsLimit = 2500;
            }

            // Append payment notes if provided
            var renewalText = request.Months > 1 ? $" ({request.Months} meses)" : "";
            if (!string.IsNullOrWhiteSpace(request.PaymentNotes))
            {
                agent.Subscription.PaymentNotes += $"\n[{now:yyyy-MM-dd}] Activación a {request.PlanTier}{renewalText}: {request.PaymentNotes}";
            }
            else if (request.Months > 1)
            {
                agent.Subscription.PaymentNotes += $"\n[{now:yyyy-MM-dd}] Renovación de {request.Months} meses a {request.PlanTier}";
            }

            await context.SaveChangesAsync(ct);
            return Results.Ok(agent.Subscription);
        })
        .WithTags("Subscriptions")
        .RequireAuthorization();
    }
}
