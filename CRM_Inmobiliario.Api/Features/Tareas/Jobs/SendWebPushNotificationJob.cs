using System;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using WebPush;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Linq;

using Hangfire;

namespace CRM_Inmobiliario.Api.Features.Tareas.Jobs;

public class SendWebPushNotificationJob
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SendWebPushNotificationJob> _logger;
    private readonly CrmDbContext _dbContext;

    public SendWebPushNotificationJob(
        IConfiguration configuration,
        ILogger<SendWebPushNotificationJob> logger,
        CrmDbContext dbContext)
    {
        _configuration = configuration;
        _logger = logger;
        _dbContext = dbContext;
    }

    [DisableConcurrentExecution(timeoutInSeconds: 30)]
    public async Task ExecuteAsync()
    {
        var outboxRecords = await _dbContext.PushNotificationsOutbox
            .OrderBy(o => o.RetryCount)
            .ThenBy(o => o.CreatedAt)
            .Take(100)
            .ToListAsync();

        if (!outboxRecords.Any()) return;

        var vapidSubject = _configuration["VapidSettings:Subject"];
        var vapidPublicKey = _configuration["VapidSettings:PublicKey"];
        var vapidPrivateKey = _configuration["VapidSettings:PrivateKey"];

        if (string.IsNullOrEmpty(vapidSubject) || string.IsNullOrEmpty(vapidPublicKey) || string.IsNullOrEmpty(vapidPrivateKey))
        {
            _logger.LogWarning("VAPID keys not configured. Notificaciones Push no se enviarán.");
            return;
        }

        var vapidDetails = new VapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
        
        var webPushClient = new WebPushClient();
        var deadEndpoints = new System.Collections.Generic.HashSet<string>();

        foreach (var outbox in outboxRecords)
        {
            if (deadEndpoints.Contains(outbox.Endpoint))
            {
                _dbContext.PushNotificationsOutbox.Remove(outbox);
                continue;
            }

            var pushSubscription = new PushSubscription(outbox.Endpoint, outbox.P256dh, outbox.Auth);
            
            try
            {
                await webPushClient.SendNotificationAsync(pushSubscription, outbox.Payload, vapidDetails);
                _dbContext.PushNotificationsOutbox.Remove(outbox);
            }
            catch (WebPushException ex)
            {
                if (ex.StatusCode == System.Net.HttpStatusCode.Gone || 
                    ex.StatusCode == System.Net.HttpStatusCode.NotFound ||
                    ex.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
                    ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
                {
                    _logger.LogWarning($"Subscription is invalid or gone for endpoint {outbox.Endpoint}. Status code: {ex.StatusCode}");
                    _dbContext.PushNotificationsOutbox.Remove(outbox);
                    deadEndpoints.Add(outbox.Endpoint);
                    _logger.LogInformation($"Suscripción inactiva marcada para eliminación: {outbox.Endpoint}");
                }
                else
                {
                    outbox.RetryCount++;
                    if (outbox.RetryCount >= 3)
                    {
                        _logger.LogError(ex, "Drop permanente tras 3 reintentos fallidos. Endpoint: {Endpoint}, Payload: {Payload}", outbox.Endpoint, outbox.Payload);
                        _dbContext.PushNotificationsOutbox.Remove(outbox);
                        deadEndpoints.Add(outbox.Endpoint);
                    }
                }
            }
            catch (Exception ex)
            {
                outbox.RetryCount++;
                if (outbox.RetryCount >= 3)
                {
                    _logger.LogError(ex, "Drop permanente tras 3 reintentos fallidos. Endpoint: {Endpoint}, Payload: {Payload}", outbox.Endpoint, outbox.Payload);
                    _dbContext.PushNotificationsOutbox.Remove(outbox);
                    deadEndpoints.Add(outbox.Endpoint);
                }
            }
        }

        if (deadEndpoints.Any())
        {
            var subsToDelete = await _dbContext.AgentPushSubscriptions
                .Where(s => deadEndpoints.Contains(s.Endpoint))
                .ToListAsync();
            if (subsToDelete.Any())
            {
                _dbContext.AgentPushSubscriptions.RemoveRange(subsToDelete);
            }
        }

        await _dbContext.SaveChangesAsync();
    }
}
