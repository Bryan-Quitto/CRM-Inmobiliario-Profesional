using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Microsoft.Extensions.AI;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Services;

public class AgentAiStreamProcessor
{
    private readonly ILogger _logger;
    private readonly LLMProviderFactory _providerFactory;
    private readonly AgentSystemPromptFactory _promptFactory;
    private readonly IDbContextFactory<CrmDbContext> _dbContextFactory;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly AgentAiTokenManager _tokenManager;

    public AgentAiStreamProcessor(
        ILogger logger,
        LLMProviderFactory providerFactory,
        AgentSystemPromptFactory promptFactory,
        IDbContextFactory<CrmDbContext> dbContextFactory,
        IServiceScopeFactory scopeFactory,
        AgentAiTokenManager tokenManager)
    {
        _logger = logger;
        _providerFactory = providerFactory;
        _promptFactory = promptFactory;
        _dbContextFactory = dbContextFactory;
        _scopeFactory = scopeFactory;
        _tokenManager = tokenManager;
    }

    public async IAsyncEnumerable<string> StreamAsync(Guid agentId, Guid conversationId, string message, CRM_Inmobiliario.Api.Features.AgentAi.Endpoints.StreamChatEndpoint.FocusedContextDto? focusedContext, [System.Runtime.CompilerServices.EnumeratorCancellation] CancellationToken cancellationToken)
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

            await using (var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken))
            {
                agent = await dbContext.Agents.Include(a => a.Agencia).FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
                if (agent == null) throw new InvalidOperationException("Agente no encontrado");

                if (await _tokenManager.IsLimitExceededAsync(agentId, agent.DailyTokenLimitPersonal, cancellationToken))
                {
                    yield return "Has alcanzado tu cuota diaria de consultas de Inteligencia Artificial. Por favor, aumenta tu límite o reinicia el contador en Configuración para continuar.";
                    yield break;
                }

                history = await dbContext.AgentMessages
                    .Where(m => m.AgentConversationId == conversationId)
                    .OrderByDescending(m => m.CreatedAt)
                    .Take(30)
                    .ToListAsync(cancellationToken);
                history.Reverse();

                providerName = agent.ActiveLLMProvider ?? "OpenAI";
                apiKey = agent.AiApiKey ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;
            }

            var provider = _providerFactory.GetProvider(providerName, apiKey);

            var messages = new List<AiMessage>
            {
                new AiMessage { Role = "system", Content = _promptFactory.CreatePrompt(agent.Agencia?.ContextoCorporativoIA) }
            };

            if (focusedContext != null)
            {
                messages.Add(new AiMessage { Role = "system", Content = $"[SISTEMA] El agente está actualmente visualizando el perfil del contacto '{focusedContext.Name}'. Las herramientas de análisis e interacciones usarán a este contacto automáticamente." });
            }
            else
            {
                messages.Add(new AiMessage { Role = "system", Content = "[SISTEMA] Si el usuario pide analizar, resumir el historial o leer las interacciones de un contacto, indícale amablemente que no puedes buscar contactos globalmente, y que debe entrar a los Detalles del Contacto y pulsar el botón '✨ Analizar con IA'." });
            }

            foreach (var msg in history)
            {
                messages.Add(new AiMessage { Role = msg.Role, Content = msg.Content });
            }
            messages.Add(new AiMessage { Role = "user", Content = message });

            _logger.LogInformation("\n=== [Agent AI Stream] Interacción de Usuario ===\nAgentId: {AgentId}\nConversationId: {ConversationId}\nMensaje: {Message}\n================================================", agentId, conversationId, message);

            var context = new ToolExecutionContext
            {
                UserId = agentId,
                Channel = "Copilot",
                ChannelIdentifier = agentId.ToString(),
                TriggerMessage = message,
                FocusedContextId = focusedContext?.Id
            };

            var tools = CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts.AiToolDefinitions.GetTools("Copilot", focusedContext != null);
            var toolHandler = new AgentAiToolHandler(_scopeFactory, _logger);

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
                    yield return "\n\nHa ocurrido un fallo inesperado (el proceso se atascó o fue muy largo), por favor, vuelva a intentarlo y si el error persiste contáctese con administración.";
                    break;
                }

                requiresAction = false;
                var textBuilder = new System.Text.StringBuilder();
                var currentToolCalls = new Dictionary<string, AiToolCall>();

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
                    var result = await toolHandler.HandleToolCallsAsync(currentToolCalls, messages, context, toolFailureCount, cancellationToken);
                    toolFailureCount = result.FailureCount;
                    if (result.RequiresAction) requiresAction = true;
                    
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
                    await _tokenManager.RecordUsageAsync(agentId, total, input, cached, output, providerName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al guardar tokens en finally para Agente {AgentId}", agentId);
                }
            }
        }
    }
}
