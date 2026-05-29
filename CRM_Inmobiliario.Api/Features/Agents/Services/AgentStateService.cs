using System;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Agents.Services;

public class AgentStateService : IAgentStateService
{
    private readonly CrmDbContext _dbContext;
    private readonly ILogger<AgentStateService> _logger;

    public AgentStateService(CrmDbContext dbContext, ILogger<AgentStateService> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task InvalidateAgentKeyAsync(Guid agentId, CancellationToken cancellationToken = default)
    {
        var agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
        if (agent != null)
        {
            agent.ByokKeyStatus = "Invalid";
            await _dbContext.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Agent {AgentId} key marked as Invalid in the database.", agentId);
        }
    }
}
