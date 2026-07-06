using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Microsoft.Extensions.AI;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Services;

public class AgentAiResponseGenerator
{
    private readonly ILogger _logger;
    private readonly LLMProviderFactory _providerFactory;
    private readonly AgentSystemPromptFactory _promptFactory;
    private readonly IDbContextFactory<CrmDbContext> _dbContextFactory;
    private readonly AgentAiTokenManager _tokenManager;

    public AgentAiResponseGenerator(
        ILogger logger,
        LLMProviderFactory providerFactory,
        AgentSystemPromptFactory promptFactory,
        IDbContextFactory<CrmDbContext> dbContextFactory,
        AgentAiTokenManager tokenManager)
    {
        _logger = logger;
        _providerFactory = providerFactory;
        _promptFactory = promptFactory;
        _dbContextFactory = dbContextFactory;
        _tokenManager = tokenManager;
    }

    public async Task<string> GenerateAsync(Guid agentId, string message, CancellationToken cancellationToken)
    {
        string providerName = "OpenAI";
        int? streamTotalTokens = null;
        int? streamInputTokens = null;
        int? streamCachedTokens = null;
        int? streamOutputTokens = null;

        try
        {
            Agent? agent;
            string apiKey = string.Empty;
            
            await using (var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken))
            {
                agent = await dbContext.Agents.Include(a => a.Agencia).FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
                if (agent == null) throw new InvalidOperationException("Agente no encontrado");

                if (await _tokenManager.IsLimitExceededAsync(agentId, agent.DailyTokenLimitPersonal, cancellationToken))
                {
                    return "Has alcanzado tu límite diario de tokens personales. Por favor, aumenta tu límite o reinicia el contador en Configuración para continuar.";
                }

                providerName = agent.ActiveLLMProvider ?? "OpenAI";
                apiKey = agent.AiApiKey ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;
            }

            var provider = _providerFactory.GetProvider(providerName, apiKey);

            var messages = new List<AiMessage>
            {
                new AiMessage { Role = "system", Content = _promptFactory.CreatePrompt(agent.Agencia?.ContextoCorporativoIA) },
                new AiMessage { Role = "user", Content = message }
            };



            var textBuilder = new System.Text.StringBuilder();

            await foreach(var update in provider.StreamChatAsync(messages, new List<AiToolDefinition>(), null, 4000, cancellationToken))
            {
                if (!string.IsNullOrEmpty(update.TextUpdate))
                {
                    textBuilder.Append(update.TextUpdate);
                }
                if (update.TotalTokens.HasValue)
                {
                    streamTotalTokens = update.TotalTokens;
                    streamInputTokens = update.InputTokens;
                    streamCachedTokens = update.CachedTokens;
                    streamOutputTokens = update.OutputTokens;
                }
            }


            return textBuilder.ToString();
        }
        catch (Polly.Timeout.TimeoutRejectedException)
        {
            _logger.LogError("Timeout excedido para el Agente {AgentId} (Posible límite de cuota RPM alcanzado).", agentId);
            throw;
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Operación cancelada por el usuario para el Agente {AgentId}.", agentId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico en AgentAiService para {AgentId}", agentId);
            throw;
        }
        finally
        {
            if (streamTotalTokens.HasValue)
            {
                try 
                {
                    await _tokenManager.RecordUsageAsync(agentId, streamTotalTokens.Value, streamInputTokens ?? 0, streamCachedTokens ?? 0, streamOutputTokens ?? 0, providerName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al registrar uso de tokens en finally para Agente {AgentId}", agentId);
                }
            }
        }
    }
}
