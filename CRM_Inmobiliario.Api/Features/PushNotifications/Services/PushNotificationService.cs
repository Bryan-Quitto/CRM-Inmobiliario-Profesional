using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using WebPush;

namespace CRM_Inmobiliario.Api.Features.PushNotifications.Services;

public interface IPushNotificationService
{
    Task SubscribeAgentAsync(Guid agentId, string endpoint, string p256dh, string auth, string? userAgent, CancellationToken ct = default);
    Task<bool> VerifySubscriptionAsync(Guid agentId, string endpoint, CancellationToken ct = default);
    Task SendNotificationToAgentAsync(Guid agentId, string title, string body, string? url = null, CancellationToken ct = default);
    Task UnsubscribeAgentAsync(Guid agentId, string endpoint, CancellationToken ct = default);
}

public sealed class PushNotificationService : IPushNotificationService
{
    private readonly CrmDbContext _dbContext;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PushNotificationService> _logger;

    public PushNotificationService(CrmDbContext dbContext, IConfiguration configuration, ILogger<PushNotificationService> logger)
    {
        _dbContext = dbContext;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SubscribeAgentAsync(Guid agentId, string endpoint, string p256dh, string auth, string? userAgent, CancellationToken ct = default)
    {
        var existing = await _dbContext.AgentPushSubscriptions
            .FirstOrDefaultAsync(s => s.Endpoint == endpoint, ct);

        if (existing is not null)
        {
            existing.AgentId = agentId;
            existing.P256dh = p256dh;
            existing.Auth = auth;
            existing.UserAgent = userAgent;
            existing.LastUsedAt = DateTimeOffset.UtcNow;
        }
        else
        {
            _dbContext.AgentPushSubscriptions.Add(new AgentPushSubscription
            {
                Id = Guid.NewGuid(),
                AgentId = agentId,
                Endpoint = endpoint,
                P256dh = p256dh,
                Auth = auth,
                UserAgent = userAgent,
                CreatedAt = DateTimeOffset.UtcNow,
                LastUsedAt = DateTimeOffset.UtcNow
            });
        }

        await _dbContext.SaveChangesAsync(ct);
    }

    public async Task<bool> VerifySubscriptionAsync(Guid agentId, string endpoint, CancellationToken ct = default)
    {
        var exists = await _dbContext.AgentPushSubscriptions
            .AnyAsync(s => s.AgentId == agentId && s.Endpoint == endpoint, ct);
        return exists;
    }

    public async Task UnsubscribeAgentAsync(Guid agentId, string endpoint, CancellationToken ct = default)
    {
        var subscription = await _dbContext.AgentPushSubscriptions
            .FirstOrDefaultAsync(s => s.AgentId == agentId && s.Endpoint == endpoint, ct);

        if (subscription is not null)
        {
            _dbContext.AgentPushSubscriptions.Remove(subscription);
            await _dbContext.SaveChangesAsync(ct);
        }
    }

    public async Task SendNotificationToAgentAsync(Guid agentId, string title, string body, string? url = null, CancellationToken ct = default)
    {
        var subscriptions = await _dbContext.AgentPushSubscriptions
            .Where(s => s.AgentId == agentId)
            .ToListAsync(ct);

        if (!subscriptions.Any()) return;

        var vapidSubject = _configuration["VapidSettings:Subject"];
        var vapidPublicKey = _configuration["VapidSettings:PublicKey"];
        var vapidPrivateKey = _configuration["VapidSettings:PrivateKey"];

        if (string.IsNullOrEmpty(vapidSubject) || string.IsNullOrEmpty(vapidPublicKey) || string.IsNullOrEmpty(vapidPrivateKey))
        {

            return;
        }

        var vapidDetails = new VapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        var webPushClient = new WebPushClient();

        var payload = System.Text.Json.JsonSerializer.Serialize(new
        {
            notification = new
            {
                title,
                body,
                data = new { url }
            }
        });

        foreach (var sub in subscriptions)
        {
            var pushSubscription = new PushSubscription(sub.Endpoint, sub.P256dh, sub.Auth);

            try
            {
                await webPushClient.SendNotificationAsync(pushSubscription, payload, vapidDetails);
                sub.LastUsedAt = DateTimeOffset.UtcNow;
            }
            catch (WebPushException ex)
            {
                if (ex.StatusCode == System.Net.HttpStatusCode.Gone || ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    _dbContext.AgentPushSubscriptions.Remove(sub);
                    _logger.LogInformation($"Removed expired push subscription {sub.Id} for Agent {agentId}.");
                }
                else
                {
                    _logger.LogError(ex, $"Failed to send push notification to {sub.Id}.");
                }
            }
        }

        await _dbContext.SaveChangesAsync(ct);
    }
}
