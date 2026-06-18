using System.Security.Claims;
using CRM_Inmobiliario.Api.Features.PushNotifications.Models;
using CRM_Inmobiliario.Api.Features.PushNotifications.Services;
using Microsoft.AspNetCore.Mvc;

namespace CRM_Inmobiliario.Api.Features.PushNotifications;

public static class PushNotificationsEndpoints
{
    public static void MapPushNotificationsEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/agente/dispositivos/suscribir", async (
            [FromBody] PushSubscriptionRequest req,
            ClaimsPrincipal user,
            IPushNotificationService service,
            CancellationToken ct) =>
        {
            var userIdString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var agentId)) return Results.Unauthorized();

            await service.SubscribeAgentAsync(agentId, req.Endpoint, req.P256dh, req.Auth, req.UserAgent, ct);
            return Results.Ok();
        });

        endpoints.MapPost("/agente/dispositivos/verificar", async (
            [FromBody] VerifySubscriptionRequest req,
            ClaimsPrincipal user,
            IPushNotificationService service,
            CancellationToken ct) =>
        {
            var userIdString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var agentId)) return Results.Unauthorized();

            var isValid = await service.VerifySubscriptionAsync(agentId, req.Endpoint, ct);
            return Results.Ok(new { isValid });
        });

        endpoints.MapDelete("/agente/dispositivos/desuscribir", async (
            [FromBody] VerifySubscriptionRequest req,
            ClaimsPrincipal user,
            IPushNotificationService service,
            CancellationToken ct) =>
        {
            var userIdString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out var agentId)) return Results.Unauthorized();

            await service.UnsubscribeAgentAsync(agentId, req.Endpoint, ct);
            return Results.Ok();
        });
    }
}
