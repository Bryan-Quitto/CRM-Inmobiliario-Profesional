namespace CRM_Inmobiliario.Api.Features.PushNotifications.Models;

public sealed record PushSubscriptionRequest(
    string Endpoint,
    string P256dh,
    string Auth,
    string? UserAgent
);

public sealed record VerifySubscriptionRequest(
    string Endpoint
);
