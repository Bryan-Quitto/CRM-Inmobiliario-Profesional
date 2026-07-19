using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Subscriptions.Jobs;

public class SubscriptionDegradationJob
{
    private readonly CrmDbContext _dbContext;

    public SubscriptionDegradationJob(CrmDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
        var oneDayAgo = now.AddDays(-1);

        // 1. Expire subs older than 1 day past due and revert quotas
        var expiredAgents = await _dbContext.Subscriptions
            .Where(s => !s.IsManualOverride && s.Status != "Expired" && s.CurrentPeriodEnd < oneDayAgo)
            .Select(s => s.AgentId)
            .ToListAsync(cancellationToken);

        if (expiredAgents.Any())
        {
            await _dbContext.Subscriptions
                .Where(s => expiredAgents.Contains(s.AgentId))
                .ExecuteUpdateAsync(s => s
                    .SetProperty(p => p.Status, "Expired")
                    .SetProperty(p => p.UpdatedAt, now), cancellationToken);

            await _dbContext.Agents
                .Where(a => expiredAgents.Contains(a.Id))
                .ExecuteUpdateAsync(a => a
                    .SetProperty(p => p.GlobalStorageBytesLimit, 1000000000L)
                    .SetProperty(p => p.MonthlyStorageBytesLimit, 1000000000L)
                    .SetProperty(p => p.MonthlyStorageUploadsLimit, 500)
                    .SetProperty(p => p.IsPersonalAiEnabled, false)
                    .SetProperty(p => p.IsWhatsAppAiEnabled, false)
                    .SetProperty(p => p.IsFacebookAiEnabled, false)
                    .SetProperty(p => p.AutoArchivarContactos, false)
                    .SetProperty(p => p.AutoArchivarPropiedades, false), cancellationToken);
        }

        // 2. Mark as PastDue for those between now and 1 day ago
        await _dbContext.Subscriptions
            .Where(s => !s.IsManualOverride && s.Status == "Active" && s.CurrentPeriodEnd < now && s.CurrentPeriodEnd >= oneDayAgo)
            .ExecuteUpdateAsync(s => s
                .SetProperty(p => p.Status, "PastDue")
                .SetProperty(p => p.UpdatedAt, now), cancellationToken);
    }
}
