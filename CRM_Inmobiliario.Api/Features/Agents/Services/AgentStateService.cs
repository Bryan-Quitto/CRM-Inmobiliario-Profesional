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

    public async Task HandleByokQuotaExhaustedAsync(Guid agentId, CancellationToken cancellationToken = default)
    {
        var agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
        if (agent == null || agent.ByokKeyStatus == "QuotaExhausted")
        {
            return;
        }

        agent.ByokKeyStatus = "QuotaExhausted";
        agent.IsWhatsAppAiEnabled = false;
        agent.IsFacebookAiEnabled = false;
        agent.IsPersonalAiEnabled = false;

        var task = new CRM_Inmobiliario.Api.Domain.Entities.TaskItem
        {
            TipoTarea = "AiHelp",
            Titulo = "⚠️ Crédito BYOK agotado — IA desactivada",
            Descripcion = "Tu saldo del proveedor LLM se agotó. Todas tus IAs han sido desactivadas. Recarga tu cuenta y vuelve a activarlas.",
            Estado = "Pendiente",
            AgenteId = agentId,
            FechaInicio = DateTime.UtcNow,
            DuracionMinutos = 30
        };

        _dbContext.Tasks.Add(task);
        await _dbContext.SaveChangesAsync(cancellationToken);
        
        _logger.LogWarning("Agent {AgentId} key marked as QuotaExhausted and AIs disabled.", agentId);
    }
}
