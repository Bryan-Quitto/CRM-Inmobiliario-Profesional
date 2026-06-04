using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System.Collections.Concurrent;
using Microsoft.Extensions.Caching.Memory;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Services;

public class AgentAiService
{
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, Lazy<SemaphoreSlim>> _financeLocks = new();
    private readonly ILogger<AgentAiService> _logger;
    private readonly LLMProviderFactory _providerFactory;
    private readonly AgentSystemPromptFactory _promptFactory;
    private readonly Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> _dbContextFactory;
    private readonly ICoreAiToolExecutor _toolExecutor;
    private readonly IMemoryCache _cache;
    private readonly IServiceScopeFactory _scopeFactory;

    public AgentAiService(
        ILogger<AgentAiService> logger,
        LLMProviderFactory providerFactory,
        AgentSystemPromptFactory promptFactory,
        ICoreAiToolExecutor toolExecutor,
        Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory,
        IMemoryCache cache,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _providerFactory = providerFactory;
        _promptFactory = promptFactory;
        _toolExecutor = toolExecutor;
        _dbContextFactory = dbContextFactory;
        _cache = cache;
        _scopeFactory = scopeFactory;
    }

    public async Task<string> GenerateResponseAsync(Guid agentId, string message, CancellationToken cancellationToken = default)
    {
        var semaphore = _cache.GetOrCreate(agentId.ToString(), e => { e.SlidingExpiration = TimeSpan.FromMinutes(10); return new Lazy<SemaphoreSlim>(() => new SemaphoreSlim(1,1)); })!.Value;
        await semaphore.WaitAsync(cancellationToken);
        
        try
        {
            Agent? agent;
            await using var _dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
            agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
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
        finally
        {
            semaphore.Release();
        }
    }

    public async IAsyncEnumerable<string> StreamResponseAsync(Guid agentId, Guid conversationId, string message, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var semaphore = _cache.GetOrCreate(conversationId.ToString(), e => { e.SlidingExpiration = TimeSpan.FromMinutes(10); return new Lazy<SemaphoreSlim>(() => new SemaphoreSlim(1,1)); })!.Value;
        await semaphore.WaitAsync(cancellationToken);
        try
        {
            Agent? agent;
            List<AgentMessage> history;
            await using var _dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
            agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
            if (agent == null) throw new InvalidOperationException("Agente no encontrado");

            history = await _dbContext.AgentMessages
                .Where(m => m.AgentConversationId == conversationId)
                .OrderByDescending(m => m.CreatedAt)
                .Take(30)
                .ToListAsync(cancellationToken);
            history.Reverse();

            var providerName = agent.ActiveLLMProvider ?? "OpenAI";
        string apiKey = agent.AiApiKey ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;

        var provider = _providerFactory.GetProvider(providerName, apiKey);

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
        int toolFailureCount = 0;
        int iterationCount = 0;
        long totalAccumulatedTotalTokens = 0;
        long totalAccumulatedInputTokens = 0;
        long totalAccumulatedCachedTokens = 0;
        long totalAccumulatedOutputTokens = 0;

        while (requiresAction)
        {
            iterationCount++;
            if (iterationCount > 5)
            {
                _logger.LogWarning("Límite de iteraciones excedido para Copilot. Agente {AgentId}. Activando Circuit Breaker.", agentId);
                yield return "\n\nHa ocurrido un fallo inesperado (demasiadas iteraciones), por favor, vuelva a intentarlo y si el error persiste contactese con administracion.";
                break;
            }

            requiresAction = false;
            var textBuilder = new System.Text.StringBuilder();
            var currentToolCalls = new Dictionary<string, CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall>();

            int? streamTotalTokens = null;
            int? streamInputTokens = null;
            int? streamCachedTokens = null;
            int? streamOutputTokens = null;

            await foreach(var update in provider.StreamChatAsync(messages, tools, null, 4000, cancellationToken))
            {
                if (!string.IsNullOrEmpty(update.TextUpdate))
                {
                    textBuilder.Append(update.TextUpdate);
                    finalFullText.Append(update.TextUpdate);
                    yield return update.TextUpdate;
                }
                if (update.ToolCallUpdate != null)
                {
                    var callId = update.ToolCallUpdate.Id;
                    if (string.IsNullOrEmpty(callId)) callId = update.ToolCallUpdate.Index?.ToString() ?? "default";
                    if (!currentToolCalls.ContainsKey(callId))
                    {
                        if (string.IsNullOrEmpty(update.ToolCallUpdate.Id)) update.ToolCallUpdate.Id = callId;
                        currentToolCalls[callId] = update.ToolCallUpdate;
                    }
                    else
                    {
                        currentToolCalls[callId].Arguments += update.ToolCallUpdate.Arguments;
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
                totalAccumulatedTotalTokens += streamTotalTokens.Value;
                totalAccumulatedInputTokens += streamInputTokens ?? 0;
                totalAccumulatedCachedTokens += streamCachedTokens ?? 0;
                totalAccumulatedOutputTokens += streamOutputTokens ?? 0;
            }

            if (currentToolCalls.Any())
            {
                messages.Add(new AiMessage { Role = "assistant", Content = "", ToolCalls = currentToolCalls.Values.ToList() });
                
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                try
                {
                    var toolTasks = currentToolCalls.Values.Select(async call => 
                    {
                        string toolResult = "";
                        bool jsonError = false;
                        try
                        {
                            var argsDict = System.Text.Json.JsonSerializer.Deserialize<IDictionary<string, object?>>(call.Arguments);
                            if (argsDict == null) throw new System.Text.Json.JsonException("Null JSON is not allowed.");
                        }
                        catch (Exception ex) when (ex is System.Text.Json.JsonException || ex is ArgumentNullException)
                        {
                            _logger.LogWarning(ex, "Error al deserializar JSON de los argumentos del tool {Tool}", call.Name);
                            jsonError = true;
                            toolResult = "Error Crítico: El JSON de los argumentos es inválido. Por favor revisa y corrige el formato.";
                        }

                        if (!jsonError)
                        {
                            try
                            {
                                await using var scope = _scopeFactory.CreateAsyncScope();
                                var toolExecutor = scope.ServiceProvider.GetRequiredService<ICoreAiToolExecutor>();
                                toolResult = await toolExecutor.HandleToolCallAsync(call, context, linkedCts.Token);
                            }
                            catch
                            {
                                await linkedCts.CancelAsync();
                                throw;
                            }
                        }
                        return new { Call = call, Result = toolResult };
                    }).ToList();

                    var results = await Task.WhenAll(toolTasks);

                    foreach (var res in results)
                    {
                        if (res.Result.StartsWith("Error Crítico:"))
                        {
                            toolFailureCount++;
                            if (toolFailureCount >= 3)
                            {
                                _logger.LogWarning("Circuit Breaker activado para Copilot. Agente {AgentId}. Demasiados errores críticos.", agentId);
                            }
                        }

                        messages.Add(new AiMessage { Role = "tool", Content = res.Result, ToolCallId = res.Call.Id });
                        requiresAction = true;
                    }
                }
                catch
                {
                    await linkedCts.CancelAsync();
                    throw;
                }

                if (toolFailureCount >= 3)
                {
                    yield return "\n\nHa ocurrido un fallo inesperado, por favor, vuelva a intentarlo y si el error persiste contactese con administracion.";
                    requiresAction = false;
                    break;
                }
            }
        }
        
        if (totalAccumulatedTotalTokens > 0)
        {
            int total, input, cached, output;
            try
            {
                checked 
                { 
                    total = (int)totalAccumulatedTotalTokens; 
                    input = (int)totalAccumulatedInputTokens;
                    cached = (int)totalAccumulatedCachedTokens;
                    output = (int)totalAccumulatedOutputTokens;
                }
            }
            catch (OverflowException)
            {
                _logger.LogWarning("Integer Overflow en tokens detectado y mitigado.");
                total = int.MaxValue;
                input = int.MaxValue;
                cached = int.MaxValue;
                output = int.MaxValue;
            }
            await RecordTokenUsageAsync(agentId, total, input, cached, output, providerName, cancellationToken);
        }
        }
        finally
        {
            semaphore.Release();
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

        var cacheKey = agentId.ToString() + "_tokens";
        var lazySemaphore = _financeLocks.GetOrAdd(cacheKey, key => {
            _ = Task.Run(async () => {
                await Task.Delay(TimeSpan.FromMinutes(10));
                _financeLocks.TryRemove(key, out var removed);
            });
            return new Lazy<SemaphoreSlim>(() => new SemaphoreSlim(1,1));
        });
        var semaphore = lazySemaphore.Value;
        await semaphore.WaitAsync(cancellationToken);
        try
        {
            int retryCount = 0;
            const int maxRetries = 3;

            while (retryCount < maxRetries)
        {
            AgentDailyTokenUsage? usage = null;
            await using var _dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
            try
            {
                usage = await _dbContext.AgentDailyTokenUsages
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
            catch (DbUpdateConcurrencyException ex)
            {
                retryCount++;
                _logger.LogWarning(ex, "Conflicto de concurrencia al actualizar tokens diarios para el agente {AgentId}. Intento {RetryCount}/{MaxRetries}", agentId, retryCount, maxRetries);
                
                if (retryCount >= maxRetries) throw;
                
                await Task.Delay(100 * retryCount, cancellationToken);
            }
            catch (DbUpdateException ex)
            {
                retryCount++;
                _logger.LogWarning(ex, "Error de base de datos al actualizar tokens diarios para el agente {AgentId}. Intento {RetryCount}/{MaxRetries}", agentId, retryCount, maxRetries);
                
                if (retryCount >= maxRetries) throw;
                
                await Task.Delay(100 * retryCount, cancellationToken);
            }
        }
        }
        finally
        {
            semaphore.Release();
        }
    }
}





