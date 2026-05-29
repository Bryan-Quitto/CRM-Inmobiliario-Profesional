using System;
using System.Threading;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.Agents.Services;

public interface IAgentStateService
{
    Task InvalidateAgentKeyAsync(Guid agentId, CancellationToken cancellationToken = default);
}
