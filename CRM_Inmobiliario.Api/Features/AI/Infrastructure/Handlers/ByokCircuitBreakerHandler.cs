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

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            if (request.Options.TryGetValue(Constants.AgentIdOptionKey, out Guid agentId))
            {
                _logger.LogWarning("Fallo de autenticación detectado. Invalidando llave BYOK para Agente: {AgentId}", agentId);
                
                await _agentStateService.InvalidateAgentKeyAsync(agentId, cancellationToken);
            }
            else
            {
                _logger.LogError("Fallo auth, pero AgentId no fue provisto en HttpRequestOptions.");
            }
        }
        else if (response.StatusCode == System.Net.HttpStatusCode.PaymentRequired || 
                 ((response.StatusCode == System.Net.HttpStatusCode.TooManyRequests || 
                   response.StatusCode == System.Net.HttpStatusCode.Forbidden) && 
                  await IsQuotaExhaustedAsync(response)))
        {
            if (request.Options.TryGetValue(Constants.AgentIdOptionKey, out Guid agentId))
            {
                _logger.LogWarning("Fallo de facturación (Quota Exhausted) detectado. Desactivando IA para Agente: {AgentId}", agentId);
                
                await _agentStateService.HandleByokQuotaExhaustedAsync(agentId, cancellationToken);
            }
            else
            {
                _logger.LogError("Fallo de cuota, pero AgentId no fue provisto en HttpRequestOptions.");
            }
        }

        return response;
    }

    private async Task<bool> IsQuotaExhaustedAsync(HttpResponseMessage response)
    {
        if (response.Content == null) return false;
        var body = await response.Content.ReadAsStringAsync();
        return body.Contains("insufficient_quota", StringComparison.OrdinalIgnoreCase) || 
               body.Contains("Billing", StringComparison.OrdinalIgnoreCase);
    }
}
