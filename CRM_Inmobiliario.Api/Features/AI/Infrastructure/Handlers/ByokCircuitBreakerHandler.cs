using System;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain;
using CRM_Inmobiliario.Api.Features.Agents.Services;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.AI.Infrastructure.Handlers;

public class ByokCircuitBreakerHandler : DelegatingHandler
{
    private readonly IAgentStateService _agentStateService;
    private readonly ILogger<ByokCircuitBreakerHandler> _logger;

    public ByokCircuitBreakerHandler(IAgentStateService agentStateService, ILogger<ByokCircuitBreakerHandler> logger)
    {
        _agentStateService = agentStateService;
        _logger = logger;
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var response = await base.SendAsync(request, cancellationToken);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized || 
            response.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
        {
            if (request.Options.TryGetValue(Constants.AgentIdOptionKey, out Guid agentId))
            {
                _logger.LogWarning("Fallo de facturación/autenticación detectado. Invalidando llave BYOK para Agente: {AgentId}", agentId);
                
                await _agentStateService.InvalidateAgentKeyAsync(agentId, cancellationToken);
            }
            else
            {
                _logger.LogError("Fallo auth, pero AgentId no fue provisto en HttpRequestOptions.");
            }
        }

        return response;
    }
}
