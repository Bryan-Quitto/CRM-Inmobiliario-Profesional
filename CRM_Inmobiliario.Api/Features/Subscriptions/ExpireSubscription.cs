using System.Security.Claims;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Subscriptions;

public static class ExpireSubscriptionFeature
{
    public static void MapExpireSubscription(this IEndpointRouteBuilder app)
    {
        app.MapPost("/admin/subscriptions/{id:guid}/expire", async (Guid id, ClaimsPrincipal user, CrmDbContext context, CancellationToken ct) =>
        {
            var userId = CRM_Inmobiliario.Api.Extensions.ClaimsPrincipalExtensions.GetRequiredUserId(user);
            var reqAgente = await context.Agents.AsNoTracking().Select(a => new { a.Id, a.Rol }).FirstOrDefaultAsync(a => a.Id == userId, ct);
            if (reqAgente?.Rol != "Admin") return Results.Forbid();

            var subscription = await context.Subscriptions.Include(s => s.Agent).FirstOrDefaultAsync(s => s.Id == id, ct);
            if (subscription is null) return Results.NotFound();

            subscription.Status = "Expired";
            subscription.UpdatedAt = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            if (subscription.Agent != null)
            {
                subscription.Agent.GlobalStorageBytesLimit = 1000000000;  // 1 GB — estado degradado
                subscription.Agent.MonthlyStorageBytesLimit = 1000000000; // 1 GB/mes — estado degradado
                subscription.Agent.MonthlyStorageUploadsLimit = 500;
                subscription.Agent.IsPersonalAiEnabled = false;
                subscription.Agent.IsWhatsAppAiEnabled = false;
                subscription.Agent.IsFacebookAiEnabled = false;
                subscription.Agent.AutoArchivarContactos = false;
                subscription.Agent.AutoArchivarPropiedades = false;
            }

            await context.SaveChangesAsync(ct);
            return Results.Ok();
        })
        .WithTags("Subscriptions")
        .RequireAuthorization();
    }
}
