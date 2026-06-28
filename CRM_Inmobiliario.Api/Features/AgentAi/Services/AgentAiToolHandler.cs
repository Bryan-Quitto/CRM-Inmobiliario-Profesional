using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Services;

public class AgentAiToolHandler
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger _logger;

    public AgentAiToolHandler(IServiceScopeFactory scopeFactory, ILogger logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task<(int FailureCount, bool RequiresAction)> HandleToolCallsAsync(
        Dictionary<string, AiToolCall> currentToolCalls, 
        List<AiMessage> messages, 
        ToolExecutionContext context,
        int currentFailureCount,
        CancellationToken cancellationToken)
    {
        int failureCount = currentFailureCount;
        bool requiresAction = false;
        
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
                    failureCount++;
                    if (failureCount >= 3)
                    {
                        _logger.LogWarning("Circuit Breaker activado para Copilot. Agente {AgentId}. Demasiados errores críticos.", context.UserId);
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

        return (failureCount, requiresAction);
    }
}
