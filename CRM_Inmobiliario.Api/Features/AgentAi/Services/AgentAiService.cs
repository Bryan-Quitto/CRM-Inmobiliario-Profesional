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
    private readonly ILogger<AgentAiService> _logger;
    private readonly LLMProviderFactory _providerFactory;
    private readonly AgentSystemPromptFactory _promptFactory;
    private readonly Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> _dbContextFactory;
    private readonly ICoreAiToolExecutor _toolExecutor;
    private readonly IServiceScopeFactory _scopeFactory;

    public static readonly ConcurrentDictionary<string, SemaphoreSlim> Locks = new();
    public static readonly SemaphoreSlim GlobalConcurrencyLock = new(21, 21);

    public AgentAiService(
        ILogger<AgentAiService> logger,
        LLMProviderFactory providerFactory,
        AgentSystemPromptFactory promptFactory,
        ICoreAiToolExecutor toolExecutor,
        Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _providerFactory = providerFactory;
        _promptFactory = promptFactory;
        _toolExecutor = toolExecutor;
        _dbContextFactory = dbContextFactory;
        _scopeFactory = scopeFactory;
    }

    public async Task<string> GenerateResponseAsync(Guid agentId, string message, CancellationToken cancellationToken = default)
    {
        var semaphore = Locks.GetOrAdd(agentId.ToString(), _ => new SemaphoreSlim(1, 1));
        
        await semaphore.WaitAsync(cancellationToken);
        
        try
        {
            await GlobalConcurrencyLock.WaitAsync(cancellationToken);
            try
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
                
                await using (var _dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken))
                {
                    agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
                    if (agent == null) throw new InvalidOperationException("Agente no encontrado");

                    var today = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;
                    var usage = await _dbContext.AgentDailyTokenUsages.FirstOrDefaultAsync(u => u.AgentId == agentId && u.Date == today, cancellationToken);
                    if (usage != null && usage.TokensUsed >= agent.DailyTokenLimitPersonal)
                    {
                        return "Has alcanzado tu límite diario de tokens personales. Por favor, aumenta tu límite o reinicia el contador en Configuración para continuar.";
                    }

                    providerName = agent.ActiveLLMProvider ?? "OpenAI";
                    apiKey = agent.AiApiKey ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;
                }

                var provider = _providerFactory.GetProvider(providerName, apiKey);

                var messages = new List<CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage>
                {
                    new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "system", Content = _promptFactory.CreatePrompt() },
                    new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = "user", Content = message }
                };

                _logger.LogInformation("\n=== [Agent AI] Interacción de Usuario ===\nAgentId: {AgentId}\nMensaje: {Message}\n=======================================", agentId, message);

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

                _logger.LogInformation("\n=== [Agent AI] Respuesta de IA ===\nAgentId: {AgentId}\nTokens Totales: {TotalTokens} (Entrada: {InputTokens}, Salida: {OutputTokens})\nRespuesta: {Response}\n================================", agentId, streamTotalTokens ?? 0, streamInputTokens ?? 0, streamOutputTokens ?? 0, textBuilder.ToString());
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
                        await RecordTokenUsageAsync(agentId, streamTotalTokens.Value, streamInputTokens ?? 0, streamCachedTokens ?? 0, streamOutputTokens ?? 0, providerName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al registrar uso de tokens en finally para Agente {AgentId}", agentId);
                    }
                }
            }
        }
        finally
        {
            GlobalConcurrencyLock.Release();
        }
        }
        finally
        {
            semaphore.Release();
        }
    }

    public async IAsyncEnumerable<string> StreamResponseAsync(Guid agentId, Guid conversationId, string message, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var semaphore = Locks.GetOrAdd(agentId.ToString(), _ => new SemaphoreSlim(1, 1));
        
        await semaphore.WaitAsync(cancellationToken);

        try
        {
            await GlobalConcurrencyLock.WaitAsync(cancellationToken);
            try
            {
            string providerName = "OpenAI";
            long totalAccumulatedTotalTokens = 0;
            long totalAccumulatedInputTokens = 0;
            long totalAccumulatedCachedTokens = 0;
            long totalAccumulatedOutputTokens = 0;

            try
            {
                Agent? agent;
                List<AgentMessage> history;
                string apiKey = string.Empty;

                await using (var _dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken))
                {
                    agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
                    if (agent == null) throw new InvalidOperationException("Agente no encontrado");

                    var today = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;
                    var usage = await _dbContext.AgentDailyTokenUsages.FirstOrDefaultAsync(u => u.AgentId == agentId && u.Date == today, cancellationToken);
                    if (usage != null && usage.TokensUsed >= agent.DailyTokenLimitPersonal)
                    {
                        yield return "Has alcanzado tu límite diario de tokens personales. Por favor, aumenta tu límite o reinicia el contador en Configuración para continuar.";
                        yield break;
                    }

                    history = await _dbContext.AgentMessages
                        .Where(m => m.AgentConversationId == conversationId)
                        .OrderByDescending(m => m.CreatedAt)
                        .Take(30)
                        .ToListAsync(cancellationToken);
                    history.Reverse();

                    providerName = agent.ActiveLLMProvider ?? "OpenAI";
                    apiKey = agent.AiApiKey ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;
                }

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

                _logger.LogInformation("\n=== [Agent AI Stream] Interacción de Usuario ===\nAgentId: {AgentId}\nConversationId: {ConversationId}\nMensaje: {Message}\n================================================", agentId, conversationId, message);

                var context = new ToolExecutionContext
                {
                    UserId = agentId,
                    Channel = "Copilot",
                    TriggerMessage = message
                };

                var tools = CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts.AiToolDefinitions.GetTools("Copilot");

                bool requiresAction = true;
                var finalFullText = new System.Text.StringBuilder();
                int toolFailureCount = 0;
                int iterationCount = 0;

                while (requiresAction)
                {
                    iterationCount++;
                    if (iterationCount > 5)
                    {
                        _logger.LogWarning("Límite de iteraciones excedido para Copilot. Agente {AgentId}. Activando Circuit Breaker.", agentId);
                        yield return "\n\nHa ocurrido un fallo inesperado (demasiadas iteraciones), por favor, vuelva a intentarlo y si el error persiste contáctese con administración.";
                        break;
                    }

                    requiresAction = false;
                    var textBuilder = new System.Text.StringBuilder();
                    var currentToolCalls = new Dictionary<string, CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall>();

                    int? streamTotalTokens = null;
                    int? streamInputTokens = null;
                    int? streamCachedTokens = null;
                    int? streamOutputTokens = null;

                    try
                    {
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
                                var callKey = update.ToolCallUpdate.Index?.ToString() ?? update.ToolCallUpdate.Id;
                                if (string.IsNullOrEmpty(callKey)) callKey = "default";

                                if (!currentToolCalls.ContainsKey(callKey))
                                {
                                    if (string.IsNullOrEmpty(update.ToolCallUpdate.Id)) update.ToolCallUpdate.Id = callKey;
                                    currentToolCalls[callKey] = update.ToolCallUpdate;
                                }
                                else
                                {
                                    var existing = currentToolCalls[callKey];
                                    if (!string.IsNullOrEmpty(update.ToolCallUpdate.Id)) existing.Id = update.ToolCallUpdate.Id;
                                    if (!string.IsNullOrEmpty(update.ToolCallUpdate.Name)) existing.Name = update.ToolCallUpdate.Name;
                                    existing.Arguments += update.ToolCallUpdate.Arguments;
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
                    }
                    finally
                    {
                        if (streamTotalTokens.HasValue)
                        {
                            totalAccumulatedTotalTokens += streamTotalTokens.Value;
                            totalAccumulatedInputTokens += streamInputTokens ?? 0;
                            totalAccumulatedCachedTokens += streamCachedTokens ?? 0;
                            totalAccumulatedOutputTokens += streamOutputTokens ?? 0;
                        }
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
                                    string argumentsToDeserialize = string.IsNullOrWhiteSpace(call.Arguments) ? "{}" : call.Arguments;
                                    var argsDict = System.Text.Json.JsonSerializer.Deserialize<IDictionary<string, object?>>(argumentsToDeserialize);
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
                            yield return "\n\nHa ocurrido un fallo inesperado, por favor, vuelva a intentarlo y si el error persiste contáctese con administración.";
                            requiresAction = false;
                            break;
                        }
                    }
                }

                _logger.LogInformation("\n=== [Agent AI Stream] Respuesta de IA Final ===\nAgentId: {AgentId}\nConversationId: {ConversationId}\nTokens Totales: {TotalTokens} (Entrada: {InputTokens}, Salida: {OutputTokens})\nRespuesta: {Response}\n===============================================", agentId, conversationId, totalAccumulatedTotalTokens, totalAccumulatedInputTokens, totalAccumulatedOutputTokens, finalFullText.ToString());
            }
            finally
            {
                if (totalAccumulatedTotalTokens > 0)
                {
                    int total = (int)totalAccumulatedTotalTokens; 
                    int input = (int)totalAccumulatedInputTokens;
                    int cached = (int)totalAccumulatedCachedTokens;
                    int output = (int)totalAccumulatedOutputTokens;

                    try 
                    {
                        await RecordTokenUsageAsync(agentId, total, input, cached, output, providerName);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error al guardar tokens en finally para Agente {AgentId}", agentId);
                    }
                }
            }
        }
        finally
        {
            GlobalConcurrencyLock.Release();
        }
        }
        finally
        {
            semaphore.Release();
        }
    }

    private async Task RecordTokenUsageAsync(Guid agentId, int totalTokens, int inputTokens, int cachedTokens, int outputTokens, string provider)
    {
        var today = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;

        decimal inputCostPer1K = provider == "Gemini" ? 0.000075m : 0.000150m;
        decimal outputCostPer1K = provider == "Gemini" ? 0.000300m : 0.000600m;
        decimal cachedCostPer1K = provider == "Gemini" ? 0.00001875m : 0m; 

        var inputCost = (inputTokens / 1000m) * inputCostPer1K;
        var outputCost = (outputTokens / 1000m) * outputCostPer1K;
        var cachedCost = (cachedTokens / 1000m) * cachedCostPer1K;

        var currentCost = inputCost + outputCost + cachedCost;

        await using var _dbContext = await _dbContextFactory.CreateDbContextAsync(CancellationToken.None);
        var usage = await _dbContext.AgentDailyTokenUsages
            .FirstOrDefaultAsync(u => u.AgentId == agentId && u.Date == today && u.Channel == "Copilot", CancellationToken.None);

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
                Channel = "Copilot"
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

        await _dbContext.SaveChangesAsync(CancellationToken.None);
    }
}
