using System.Security.Claims;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Subscriptions;

public static class UpdateSubscriptionFeature
{
    public record UpdateCommand(string PlanTier, DateTimeOffset CurrentPeriodEnd, string PaymentNotes);

    public static void MapUpdateSubscription(this IEndpointRouteBuilder app)
    {
        app.MapPut("/admin/subscriptions/{id:guid}", async (Guid id, [FromBody] UpdateCommand command, ClaimsPrincipal user, CrmDbContext context, CancellationToken ct) =>
        {
            var userId = CRM_Inmobiliario.Api.Extensions.ClaimsPrincipalExtensions.GetRequiredUserId(user);
            var reqAgente = await context.Agents.AsNoTracking().Select(a => new { a.Id, a.Rol }).FirstOrDefaultAsync(a => a.Id == userId, ct);
            if (reqAgente?.Rol != "Admin") return Results.Forbid();

            var subscription = await context.Subscriptions.Include(s => s.Agent).FirstOrDefaultAsync(s => s.Id == id, ct);
            if (subscription is null) return Results.NotFound();

            subscription.PlanTier = command.PlanTier;
            subscription.CurrentPeriodEnd = command.CurrentPeriodEnd;
            subscription.PaymentNotes = command.PaymentNotes;
            subscription.UpdatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            if (subscription.Agent != null)
            {
                if (command.PlanTier == "Pro")
                {
                    subscription.Agent.GlobalStorageBytesLimit = 15000000000; // 15 GB acumulado
                    subscription.Agent.MonthlyStorageBytesLimit = 3000000000;  // 3 GB/mes de ingesta
                    subscription.Agent.MonthlyStorageUploadsLimit = 6000;
                }
                else
                {
                    subscription.Agent.GlobalStorageBytesLimit = 5000000000;  // 5 GB acumulado
                    subscription.Agent.MonthlyStorageBytesLimit = 1000000000; // 1 GB/mes de ingesta
                    subscription.Agent.MonthlyStorageUploadsLimit = 2500;
                }
            }

            await context.SaveChangesAsync(ct);
            return Results.Ok(subscription);
        })
        .WithTags("Subscriptions")
        .RequireAuthorization();
    }
}
