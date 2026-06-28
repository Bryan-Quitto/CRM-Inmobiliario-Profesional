using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Services;

public class AgentAiTokenManager
{
    private readonly IDbContextFactory<CrmDbContext> _dbContextFactory;

    public AgentAiTokenManager(IDbContextFactory<CrmDbContext> dbContextFactory)
    {
        _dbContextFactory = dbContextFactory;
    }

    public async Task<bool> IsLimitExceededAsync(Guid agentId, int limit, CancellationToken cancellationToken)
    {
        var today = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        var usage = await dbContext.AgentDailyTokenUsages.FirstOrDefaultAsync(u => u.AgentId == agentId && u.Date == today, cancellationToken);
        return usage != null && usage.TokensUsed >= limit;
    }

    public async Task RecordUsageAsync(Guid agentId, int totalTokens, int inputTokens, int cachedTokens, int outputTokens, string provider, string channel = "Copilot")
    {
        var today = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;

        decimal inputCostPer1K = provider == "Gemini" ? 0.000075m : 0.000150m;
        decimal outputCostPer1K = provider == "Gemini" ? 0.000300m : 0.000600m;
        decimal cachedCostPer1K = provider == "Gemini" ? 0.00001875m : 0m; 

        var inputCost = (inputTokens / 1000m) * inputCostPer1K;
        var outputCost = (outputTokens / 1000m) * outputCostPer1K;
        var cachedCost = (cachedTokens / 1000m) * cachedCostPer1K;

        var currentCost = inputCost + outputCost + cachedCost;

        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(CancellationToken.None);
        var usage = await dbContext.AgentDailyTokenUsages
            .FirstOrDefaultAsync(u => u.AgentId == agentId && u.Date == today && u.Channel == channel, CancellationToken.None);

        if (usage == null)
        {
            usage = new AgentDailyTokenUsage
            {
                Id = Guid.NewGuid(),
                AgentId = agentId,
                Date = today,
                TokensUsed = totalTokens,
                InputTokens = inputTokens,
                CachedTokens = cachedTokens,
                OutputTokens = outputTokens,
                CostoUSD = currentCost,
                Channel = channel
            };
            dbContext.AgentDailyTokenUsages.Add(usage);
        }
        else
        {
            usage.TokensUsed += totalTokens;
            usage.InputTokens += inputTokens;
            usage.CachedTokens += cachedTokens;
            usage.OutputTokens += outputTokens;
            usage.CostoUSD += currentCost;
        }

        await dbContext.SaveChangesAsync(CancellationToken.None);
    }
}
