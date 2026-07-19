using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Infrastructure.Filters;

public class SubscriptionWriteGuardFilter : IEndpointFilter
{
    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        var method = httpContext.Request.Method;

        // Allow GET and OPTIONS requests (Read-Only actions)
        if (HttpMethods.IsGet(method) || HttpMethods.IsOptions(method))
        {
            return await next(context);
        }

        var dbContext = httpContext.RequestServices.GetRequiredService<CrmDbContext>();
        
        // Use user claim, if not present or not authenticated, it might be an anonymous endpoint, let it pass to auth middleware
        if (httpContext.User?.Identity?.IsAuthenticated != true)
        {
            return await next(context);
        }

        var userIdClaim = httpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return await next(context);
        }

        var agent = await dbContext.Agents
            .Include(a => a.Subscription)
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == userId);

        // If agent is an Admin, they can bypass write restrictions (optional, but usually Admins don't have these limits)
        if (agent != null && agent.Rol == "Admin")
        {
            return await next(context);
        }

        // If agent doesn't exist, let it pass to be handled by other logic
        if (agent == null)
        {
            return await next(context);
        }

        // Check subscription status
        var now = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
        var isExpired = false;

        if (agent.Subscription == null || agent.Subscription.Status == "Expired")
        {
            isExpired = true;
        }
        else if (agent.Subscription.CurrentPeriodEnd < now.AddDays(-1))
        {
            // If the date is more than 1 day in the past (past the grace period), it is effectively expired.
            isExpired = true;
        }

        if (isExpired)
        {
            return Results.Problem(
                title: "Subscription Expired",
                detail: "Tu suscripción ha vencido. Contacta al administrador para renovar. Modo solo-lectura activado.",
                statusCode: StatusCodes.Status403Forbidden
            );
        }

        return await next(context);
    }
}
