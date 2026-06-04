using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Services;

public class AgentAiService
{
    private readonly ILogger<AgentAiService> _logger;
    private readonly LLMProviderFactory _providerFactory;
    private readonly AgentSystemPromptFactory _promptFactory;
    private readonly CrmDbContext _dbContext;
    private readonly ICoreAiToolExecutor _toolExecutor;

    public AgentAiService(
        ILogger<AgentAiService> logger,
        LLMProviderFactory providerFactory,
        AgentSystemPromptFactory promptFactory,
        ICoreAiToolExecutor toolExecutor,
        CrmDbContext dbContext)
    {
        _logger = logger;
        _providerFactory = providerFactory;
        _promptFactory = promptFactory;
        _toolExecutor = toolExecutor;
        _dbContext = dbContext;
    }

    public async Task<string> GenerateResponseAsync(Guid agentId, string message, CancellationToken cancellationToken = default)
    {
        try
        {
            var agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
            if (agent == null) throw new InvalidOperationException("Agente no encontrado");

            var providerName = agent.ActiveLLMProvider ?? "OpenAI";
            string apiKey = agent.AiApiKey ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;

            var provider = _providerFactory.GetProvider(providerName, apiKey);

            var messages = new List<CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage>
            {
                new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "system", Content = _promptFactory.CreatePrompt() },
                new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "user", Content = message }
            };

            int? streamTotalTokens = null;
            int? streamInputTokens = null;
            int? streamCachedTokens = null;
            int? streamOutputTokens = null;
            
            var textBuilder = new System.Text.StringBuilder();

            await foreach(var update in provider.StreamChatAsync(messages, new List<AiToolDefinition>(), null, null, cancellationToken))
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

            if (streamTotalTokens.HasValue)
            {
                await RecordTokenUsageAsync(agentId, streamTotalTokens.Value, streamInputTokens ?? 0, streamCachedTokens ?? 0, streamOutputTokens ?? 0, providerName, cancellationToken);
            }

            return textBuilder.ToString();
        }
        catch (Polly.Timeout.TimeoutRejectedException)
        {
            _logger.LogError("Timeout excedido para el Agente {AgentId} (Posible límite de cuota RPM alcanzado).", agentId);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico en AgentAiService para {AgentId}", agentId);
            throw;
        }
    }

    public async IAsyncEnumerable<string> StreamResponseAsync(Guid agentId, Guid conversationId, string message, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
        if (agent == null) throw new InvalidOperationException("Agente no encontrado");

        var providerName = agent.ActiveLLMProvider ?? "OpenAI";
        string apiKey = agent.AiApiKey ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;

        var provider = _providerFactory.GetProvider(providerName, apiKey);

        var history = await _dbContext.AgentMessages
            .Where(m => m.AgentConversationId == conversationId)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        var messages = new List<CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage>
        {
            new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "system", Content = _promptFactory.CreatePrompt() }
        };

        foreach (var msg in history)
        {
            messages.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = msg.Role, Content = msg.Content });
        }

        // Add the current user message
        messages.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "user", Content = message });

        var context = new ToolExecutionContext
        {
            UserId = agentId,
            Channel = "Copilot",
            TriggerMessage = message
        };

        var tools = CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts.AiToolDefinitions.GetTools();

        bool requiresAction = true;
        var finalFullText = new System.Text.StringBuilder();

        while (requiresAction)
        {
            requiresAction = false;
            var textBuilder = new System.Text.StringBuilder();
            AiToolCall? currentToolCall = null;

            int? streamTotalTokens = null;
            int? streamInputTokens = null;
            int? streamCachedTokens = null;
            int? streamOutputTokens = null;

            await foreach(var update in provider.StreamChatAsync(messages, tools, null, null, cancellationToken))
            {
                if (!string.IsNullOrEmpty(update.TextUpdate))
                {
                    textBuilder.Append(update.TextUpdate);
                    finalFullText.Append(update.TextUpdate);
                    yield return update.TextUpdate;
                }
                if (update.ToolCallUpdate != null)
                {
                    if (currentToolCall == null)
                    {
                        currentToolCall = update.ToolCallUpdate;
                    }
                    else
                    {
                        currentToolCall.Arguments += update.ToolCallUpdate.Arguments;
                    }
                }
                if (update.TotalTokens.HasValue)
                {
                    streamTotalTokens = update.TotalTokens;
                    streamInputTokens = update.InputTokens;
                    streamCachedTokens = update.CachedTokens;
                    streamOutputTokens = update.OutputTokens;
                }
            }

            if (streamTotalTokens.HasValue)
            {
                await RecordTokenUsageAsync(agentId, streamTotalTokens.Value, streamInputTokens ?? 0, streamCachedTokens ?? 0, streamOutputTokens ?? 0, providerName, cancellationToken);
            }

            if (currentToolCall != null)
            {
                messages.Add(new AiMessage { Role = "assistant", Content = "", ToolCalls = new List<AiToolCall> { currentToolCall } });
                string toolResult = await _toolExecutor.HandleToolCallAsync(currentToolCall, context);
                messages.Add(new AiMessage { Role = "tool", Content = toolResult, ToolCallId = currentToolCall.Id });
                requiresAction = true;
            }
        }
    }

    private async Task RecordTokenUsageAsync(Guid agentId, int totalTokens, int inputTokens, int cachedTokens, int outputTokens, string provider, CancellationToken cancellationToken)
    {
        var today = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;

        decimal inputCostPer1K = provider == "Gemini" ? 0.000075m : 0.000150m;
        decimal outputCostPer1K = provider == "Gemini" ? 0.000300m : 0.000600m;
        decimal cachedCostPer1K = provider == "Gemini" ? 0.00001875m : 0m; 

        var inputCost = (inputTokens / 1000m) * inputCostPer1K;
        var outputCost = (outputTokens / 1000m) * outputCostPer1K;
        var cachedCost = (cachedTokens / 1000m) * cachedCostPer1K;

        var currentCost = inputCost + outputCost + cachedCost;

        int retryCount = 0;
        const int maxRetries = 3;

        while (retryCount < maxRetries)
        {
            try
            {
                var usage = await _dbContext.AgentDailyTokenUsages
                    .FirstOrDefaultAsync(u => u.AgentId == agentId && u.Date == today, cancellationToken);

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
                        CostoUSD = currentCost
                    };
                    _dbContext.AgentDailyTokenUsages.Add(usage);
                }
                else
                {
                    usage.TokensUsed += totalTokens;
                    usage.InputTokens += inputTokens;
                    usage.CachedTokens += cachedTokens;
                    usage.OutputTokens += outputTokens;
                    usage.CostoUSD += currentCost;
                }

                await _dbContext.SaveChangesAsync(cancellationToken);
                return;
            }
            catch (DbUpdateException ex)
            {
                retryCount++;
                _logger.LogWarning(ex, "Conflicto de concurrencia al actualizar tokens diarios para el agente {AgentId}. Intento {RetryCount}/{MaxRetries}", agentId, retryCount, maxRetries);
                
                if (retryCount >= maxRetries) throw;
                
                // Limpiamos el context state para intentar nuevamente desde la DB
                _dbContext.ChangeTracker.Clear();
                await Task.Delay(100 * retryCount, cancellationToken);
            }
        }
    }
}





