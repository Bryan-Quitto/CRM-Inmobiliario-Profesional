using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.RegularExpressions;

using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers;

namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

public static class FacebookAiLoopHelper
{
    public static async Task<(string FinalResponse, int TotalTokens, int InputTokens, int OutputTokens)> RunLoopAsync(
        ILLMProvider provider,
        List<(string Role, string Content)> history,
        List<AiMessage> aiMessages,
        List<AiToolDefinition> tools,
        string senderId,
        string pageId,
        Guid? contactoId,
        string messageText,
        IServiceScopeFactory scopeFactory,
        ILogger logger,
        CancellationToken ct)
    {
        bool requiresAction = true;
        int iterationCount = 0;
        int toolFailureCount = 0;
        string finalResponse = string.Empty;

        int totalAccumulatedTokens = 0;
        int totalAccumulatedInputTokens = 0;
        int totalAccumulatedOutputTokens = 0;

        while (requiresAction)
        {
            iterationCount++;
            if (iterationCount > 5)
            {

                finalResponse = "Ha ocurrido un fallo inesperado, le pido una disculpa por las molestias. Un agente humano le ayudará en unos momentos.";
                
                var execContextCb = new CRM_Inmobiliario.Api.Features.CoreAi.Services.ToolExecutionContext
                {
                    UserId = contactoId ?? Guid.Empty,
                    Channel = "Facebook",
                    TriggerMessage = messageText,
                    PhoneNumberId = pageId,
                    ContactoId = contactoId,
                    ChannelIdentifier = senderId
                };
                var fallbackToolCall = new AiToolCall { Id = "call_" + Guid.NewGuid().ToString("N"), Name = "SolicitarAsistenciaHumana", Arguments = "{\"motivo\":\"La Inteligencia Artificial se atascó procesando este mensaje y requiere tu ayuda.\"}" };
                
                await using var scopeCb = scopeFactory.CreateAsyncScope();
                var executorCb = scopeCb.ServiceProvider.GetRequiredService<CRM_Inmobiliario.Api.Features.CoreAi.Services.ICoreAiToolExecutor>();
                await executorCb.HandleToolCallAsync(fallbackToolCall, execContextCb, ct);
                
                aiMessages.Add(new AiMessage { Role = "assistant", Content = finalResponse });
                requiresAction = false;
                break;
            }



            requiresAction = false;
            var textBuilder = new System.Text.StringBuilder();
            var currentToolCalls = new Dictionary<string, AiToolCall>();
            
            int? streamTotalTokens = null;
            int? streamInputTokens = null;
            int? streamOutputTokens = null;

            await foreach (var update in provider.StreamChatAsync(aiMessages, tools, null, 4000, cancellationToken: ct))
            {
                if (!string.IsNullOrEmpty(update.TextUpdate))
                    textBuilder.Append(update.TextUpdate);

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
                            currentToolCalls[indexKey].Name = update.ToolCallUpdate.Name;
                        if (string.IsNullOrEmpty(currentToolCalls[indexKey].Id) && !string.IsNullOrEmpty(update.ToolCallUpdate.Id))
                            currentToolCalls[indexKey].Id = update.ToolCallUpdate.Id;
                    }
                }
                
                if (update.TotalTokens.HasValue)
                {
                    streamTotalTokens = update.TotalTokens;
                    streamInputTokens = update.InputTokens;
                    streamOutputTokens = update.OutputTokens;
                }
            }

            if (streamTotalTokens.HasValue)
            {
                totalAccumulatedTokens += streamTotalTokens.Value;
                totalAccumulatedInputTokens += streamInputTokens ?? 0;
                totalAccumulatedOutputTokens += streamOutputTokens ?? 0;
            }

            if (currentToolCalls.Any())
            {
                var assistantMessage = new AiMessage { Role = "assistant", Content = "" };
                var toolCallsForMsg = new List<AiToolCall>();
                foreach (var call in currentToolCalls.Values.Where(c => !string.IsNullOrWhiteSpace(c.Name)))
                {
                    toolCallsForMsg.Add(call);
                }
                assistantMessage.ToolCalls = toolCallsForMsg;
                aiMessages.Add(assistantMessage);

                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(ct);
                try
                {
                    var toolTasks = currentToolCalls.Values.Where(c => !string.IsNullOrWhiteSpace(c.Name)).Select(async call => 
                    {
                        string toolResult = "";
                        bool jsonError = false;
                        try
                        {
                            string validJsonArgs = string.IsNullOrWhiteSpace(call.Arguments) ? "{}" : call.Arguments;
                            var argsDict = JsonSerializer.Deserialize<IDictionary<string, object?>>(validJsonArgs);
                            if (argsDict == null) throw new JsonException("Null JSON");
                        }
                        catch (Exception ex)
                        {
                            logger.LogWarning(ex, "Error al deserializar JSON de los argumentos del tool {Tool} en Facebook", call.Name);
                            jsonError = true;
                            toolResult = "Error Crítico: El JSON de los argumentos es inválido.";
                        }


                        var execContext = new CRM_Inmobiliario.Api.Features.CoreAi.Services.ToolExecutionContext
                        {
                            UserId = contactoId ?? Guid.Empty,
                            Channel = "Facebook",
                            TriggerMessage = messageText,
                            PhoneNumberId = pageId,
                            ContactoId = contactoId,
                            ChannelIdentifier = senderId
                        };
                        
                        if (!jsonError)
                        {
                            try
                            {
                                await using var scope = scopeFactory.CreateAsyncScope();
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

                                finalResponse = "Ha ocurrido un fallo inesperado, le pido una disculpa por las molestias. Un agente humano le ayudará en unos momentos.";
                                
                                var fallbackToolCall = new AiToolCall { Id = "call_" + Guid.NewGuid().ToString("N"), Name = "SolicitarAsistenciaHumana", Arguments = "{\"motivo\":\"La IA no pudo generar una respuesta válida y requiere tu ayuda.\"}" };
                                
                                await using var scopeCb = scopeFactory.CreateAsyncScope();
                                var executorCb = scopeCb.ServiceProvider.GetRequiredService<CRM_Inmobiliario.Api.Features.CoreAi.Services.ICoreAiToolExecutor>();
                                await executorCb.HandleToolCallAsync(fallbackToolCall, res.ExecContext, linkedCts.Token);

                                aiMessages.Add(new AiMessage { Role = "assistant", Content = finalResponse });
                                requiresAction = false;
                                break;
                            }
                        }
                        aiMessages.Add(new AiMessage { Role = "tool", Content = res.Result, ToolCallId = res.Call.Id });
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
                aiMessages.Add(new AiMessage { Role = "assistant", Content = finalResponse });
            }
        }

        return (finalResponse, totalAccumulatedTokens, totalAccumulatedInputTokens, totalAccumulatedOutputTokens);
    }
}
