using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Domain.Enums;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.AI;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;
using System.Text.RegularExpressions;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public record LlmOrchestratorContext(
    string Phone,
    string PhoneNumberId,
    string MessageText,
    byte[]? AudioBytes,
    string? MediaUrl,
    Contacto? Contacto,
    Agent? TenantAgent,
    bool IsFirstMessage,
    List<ChatMessage> History
);

public interface IWhatsAppLlmOrchestrator
{
    Task<string?> ProcessLlmInteractionAsync(
        LlmOrchestratorContext context,
        string providerName,
        ILLMProvider provider,
        List<Models.AiToolDefinition> tools,
        CancellationToken cancellationToken);
}

public class WhatsAppLlmOrchestrator : IWhatsAppLlmOrchestrator
{
    private readonly ILogger<WhatsAppLlmOrchestrator> _logger;
    private readonly CRM_Inmobiliario.Api.Features.CoreAi.Services.ICoreAiToolExecutor _toolExecutor;
    private readonly IWhatsAppConversationManager _conversationManager;
    private readonly IServiceScopeFactory _scopeFactory;

    public WhatsAppLlmOrchestrator(
        ILogger<WhatsAppLlmOrchestrator> logger,
        CRM_Inmobiliario.Api.Features.CoreAi.Services.ICoreAiToolExecutor toolExecutor,
        IWhatsAppConversationManager conversationManager,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _toolExecutor = toolExecutor;
        _conversationManager = conversationManager;
        _scopeFactory = scopeFactory;
    }

    public async Task<string?> ProcessLlmInteractionAsync(
        LlmOrchestratorContext context,
        string providerName,
        ILLMProvider provider,
        List<Models.AiToolDefinition> tools,
        CancellationToken cancellationToken)
    {
        bool requiresAction = true;
        string? finalResponse = null;
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
                _logger.LogWarning("Límite de iteraciones excedido para {Phone}. Activando Circuit Breaker.", context.Phone);
                finalResponse = "Ha ocurrido un fallo inesperado, le pido una disculpa por las molestias. Un agente humano le ayudará en unos momentos.";
                
                var execContextCb = new CRM_Inmobiliario.Api.Features.CoreAi.Services.ToolExecutionContext
                {
                    UserId = context.Contacto?.Id ?? Guid.Empty,
                    Channel = "WhatsApp",
                    TriggerMessage = context.MessageText,
                    ChannelIdentifier = context.Phone,
                    PhoneNumberId = context.PhoneNumberId,
                    ContactoId = context.Contacto?.Id
                };
                var fallbackToolCall = new Models.AiToolCall { Id = "call_" + Guid.NewGuid().ToString("N"), Name = "SolicitarAsistenciaHumana", Arguments = "{\"motivo\":\"La Inteligencia Artificial se atascó procesando este mensaje y requiere tu ayuda.\"}" };
                await _toolExecutor.HandleToolCallAsync(fallbackToolCall, execContextCb, cancellationToken);
                
                context.History.Add(new ChatMessage(ChatRole.Assistant, finalResponse));
                requiresAction = false;
                break;
            }

            var chatMessagesForAi = new List<ChatMessage>();
            
            if (context.History.Count > 0 && context.History[0].Role == ChatRole.System)
            {
                chatMessagesForAi.Add(context.History[0]);
                chatMessagesForAi.AddRange(context.History.Skip(1));
            }
            else
            {
                chatMessagesForAi.AddRange(context.History);
            }

            _logger.LogInformation("--- ENVIANDO A LLM ({Count} mensajes en BD, {AiCount} enviados) ---", context.History.Count, chatMessagesForAi.Count);
            
            var aiHistory = WhatsAppHistoryMapper.MapToAiHistory(chatMessagesForAi, context.AudioBytes, context.MediaUrl);

            requiresAction = false;
            
            var textBuilder = new System.Text.StringBuilder();
            var currentToolCalls = new Dictionary<string, Models.AiToolCall>();
            
            int? streamTotalTokens = null;
            int? streamInputTokens = null;
            int? streamCachedTokens = null;
            int? streamOutputTokens = null;
            
            int estimatedTokens = (System.Text.Json.JsonSerializer.Serialize(aiHistory).Length + System.Text.Json.JsonSerializer.Serialize(tools).Length) / 4;
            if (estimatedTokens > 50000)
            {
                _logger.LogWarning("Hard limit de seguridad excedido: El contexto estimado es de {Estimado} tokens.", estimatedTokens);
                throw new InvalidOperationException("Se ha excedido el límite de seguridad de 50,000 tokens por mensaje. Operación cancelada.");
            }

            await foreach(var update in provider.StreamChatAsync(aiHistory, tools, null, 4000, cancellationToken: cancellationToken))
            {
                if (!string.IsNullOrEmpty(update.TextUpdate))
                {
                    textBuilder.Append(update.TextUpdate);
                }
                if (update.ToolCallUpdate != null)
                {
                    var indexKey = update.ToolCallUpdate.Index?.ToString() ?? "0";
                    if (!currentToolCalls.ContainsKey(indexKey))
                    {
                        currentToolCalls[indexKey] = update.ToolCallUpdate;
                        if (string.IsNullOrEmpty(currentToolCalls[indexKey].Id))
                            currentToolCalls[indexKey].Id = "call_" + indexKey;
                    }
                    else
                    {
                        currentToolCalls[indexKey].Arguments += update.ToolCallUpdate.Arguments;
                        if (string.IsNullOrEmpty(currentToolCalls[indexKey].Name) && !string.IsNullOrEmpty(update.ToolCallUpdate.Name))
                        {
                            currentToolCalls[indexKey].Name = update.ToolCallUpdate.Name;
                        }
                        if (string.IsNullOrEmpty(currentToolCalls[indexKey].Id) && !string.IsNullOrEmpty(update.ToolCallUpdate.Id))
                        {
                            currentToolCalls[indexKey].Id = update.ToolCallUpdate.Id;
                        }
                    }
                }
                if (update.AudioTranscription != null)
                {
                    _logger.LogInformation("--- TRANSCRIPCIÓN IA ---: {Transcription}", update.AudioTranscription);
                }
                if (update.TotalTokens.HasValue)
                {
                    streamTotalTokens = update.TotalTokens;
                    streamInputTokens = update.InputTokens;
                    streamCachedTokens = update.CachedTokens;
                    streamOutputTokens = update.OutputTokens;
                }
            }

            if (streamTotalTokens.HasValue && context.Contacto != null)
            {
                _logger.LogInformation("--- CONSUMO DE TOKENS PARCIAL --- Total: {Total} | Input: {Input} | Cached: {Cached} | Output: {Output}", 
                    streamTotalTokens.Value, streamInputTokens ?? 0, streamCachedTokens ?? 0, streamOutputTokens ?? 0);

                totalAccumulatedTotalTokens += streamTotalTokens.Value;
                totalAccumulatedInputTokens += streamInputTokens ?? 0;
                totalAccumulatedCachedTokens += streamCachedTokens ?? 0;
                totalAccumulatedOutputTokens += streamOutputTokens ?? 0;
            }

            if (currentToolCalls.Any())
            {
                var assistantMessage = new ChatMessage(ChatRole.Assistant, "");
                foreach (var call in currentToolCalls.Values.Where(c => !string.IsNullOrWhiteSpace(c.Name)))
                {
                    IDictionary<string, object?>? argsDict = null;
                    try { argsDict = System.Text.Json.JsonSerializer.Deserialize<IDictionary<string, object?>>(string.IsNullOrWhiteSpace(call.Arguments) ? "{}" : call.Arguments); } catch { argsDict = new Dictionary<string, object?>(); }
                    assistantMessage.Contents.Add(new FunctionCallContent(call.Id, call.Name, argsDict ?? new Dictionary<string, object?>()));
                }
                context.History.Add(assistantMessage);

                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                try
                {
                    var toolTasks = currentToolCalls.Values.Where(c => !string.IsNullOrWhiteSpace(c.Name)).Select(async call => 
                    {
                        IDictionary<string, object?>? argsDict = null;
                        string toolResult = "";
                        bool jsonError = false;
                        try
                        {
                            string validJsonArgs = string.IsNullOrWhiteSpace(call.Arguments) ? "{}" : call.Arguments;
                            argsDict = System.Text.Json.JsonSerializer.Deserialize<IDictionary<string, object?>>(validJsonArgs);
                            if (argsDict == null) throw new System.Text.Json.JsonException("Null JSON is not allowed.");
                        }
                        catch (Exception ex) when (ex is System.Text.Json.JsonException || ex is ArgumentNullException)
                        {
                            _logger.LogWarning(ex, "Error al deserializar JSON de los argumentos del tool {Tool}", call.Name);
                            jsonError = true;
                            toolResult = "Error Crítico: El JSON de los argumentos es inválido. Por favor revisa y corrige el formato.";
                        }

                        _logger.LogInformation("--- TOOL CALL: {Tool} ---", call.Name);
                        var execContext = new CRM_Inmobiliario.Api.Features.CoreAi.Services.ToolExecutionContext
                        {
                            UserId = context.Contacto?.Id ?? Guid.Empty,
                            Channel = "WhatsApp",
                            TriggerMessage = context.MessageText,
                            ChannelIdentifier = context.Phone,
                            PhoneNumberId = context.PhoneNumberId,
                            ContactoId = context.Contacto?.Id
                        };
                        
                        if (!jsonError)
                        {
                            try
                            {
                                await using var scope = _scopeFactory.CreateAsyncScope();
                                var toolExecutor = scope.ServiceProvider.GetRequiredService<CRM_Inmobiliario.Api.Features.CoreAi.Services.ICoreAiToolExecutor>();
                                toolResult = await toolExecutor.HandleToolCallAsync(call, execContext, linkedCts.Token);
                            }
                            catch
                            {
                                await linkedCts.CancelAsync();
                                throw;
                            }
                        }
                        
                        return new { Call = call, Result = toolResult, ExecContext = execContext };
                    }).ToList();

                    var results = await Task.WhenAll(toolTasks);

                    requiresAction = true;
                    foreach (var res in results)
                    {
                        if (res.Result.StartsWith("Error Crítico:"))
                        {
                            toolFailureCount++;
                            if (toolFailureCount >= 3)
                            {
                                _logger.LogWarning("Circuit Breaker activado para {Phone}. Demasiados errores críticos de la IA.", context.Phone);
                                finalResponse = "Ha ocurrido un fallo inesperado, le pido una disculpa por las molestias. Un agente humano le ayudará en unos momentos.";
                                
                                var fallbackToolCall = new Models.AiToolCall { Id = "call_" + Guid.NewGuid().ToString("N"), Name = "SolicitarAsistenciaHumana", Arguments = "{\"motivo\":\"La IA experimentó múltiples errores críticos y necesita que retomes la conversación.\"}" };
                                await _toolExecutor.HandleToolCallAsync(fallbackToolCall, res.ExecContext, linkedCts.Token);

                                context.History.Add(new ChatMessage(ChatRole.Assistant, finalResponse));
                                requiresAction = false;
                                break;
                            }
                        }

                        context.History.Add(new ChatMessage(ChatRole.Tool, res.Result) { Contents = { new FunctionResultContent(res.Call.Id, res.Result) } });
                    }
                    if (!requiresAction) break; 
                }
                catch
                {
                    await linkedCts.CancelAsync();
                    throw;
                }
            }
            else
            {
                finalResponse = textBuilder.ToString();
                
                if (context.IsFirstMessage)
                {
                    string agentName = context.TenantAgent != null ? $"{context.TenantAgent.Nombre} {context.TenantAgent.Apellido}".Trim() : "nuestro equipo";
                    string header = $"¡Hola! Soy el asistente virtual de {agentName} 🤖.\n\n";
                    string footer = $"\n\n💡 _Si prefieres atención personalizada, solo dímelo y {agentName} se conectará contigo._";
                    
                    finalResponse = header + finalResponse + footer;
                    context.History.Add(new ChatMessage(ChatRole.Assistant, finalResponse));
                }
                else
                {
                    context.History.Add(new ChatMessage(ChatRole.Assistant, finalResponse));
                }
                
                _logger.LogInformation("--- RESPUESTA FINAL IA: {Response} ---", finalResponse);
            }
        }

        if (totalAccumulatedTotalTokens > 0 && context.Contacto != null)
        {
            _logger.LogInformation("--- CONSUMO DE TOKENS ACUMULADO --- Total: {Total} | Input: {Input} | Cached: {Cached} | Output: {Output}", 
                totalAccumulatedTotalTokens, totalAccumulatedInputTokens, totalAccumulatedCachedTokens, totalAccumulatedOutputTokens);

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
            await _conversationManager.RecordTokenUsageAsync(
                context.Contacto.AgenteId,
                context.Contacto.Id, 
                total, 
                input, 
                cached, 
                output,
                providerName,
                cancellationToken);
        }

        return finalResponse;
    }
}
