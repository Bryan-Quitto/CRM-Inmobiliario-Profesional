using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using System.ClientModel.Primitives;
using System.Text.RegularExpressions;
using Pgvector.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public sealed class WhatsAppAiService
{
    private readonly ILogger<WhatsAppAiService> _logger;
    private readonly IWhatsAppPromptBuilder _promptBuilder;
    private readonly CRM_Inmobiliario.Api.Features.CoreAi.Services.ICoreAiToolExecutor _toolExecutor;
    private readonly CRM_Inmobiliario.Api.Features.CoreAi.Services.ISemanticRouterService _semanticRouterService;
    private readonly IWhatsAppMessageSender _messageSender;
    private readonly IWhatsAppConversationManager _conversationManager;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IDbContextFactory<CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext> _dbContextFactory;
    private readonly CRM_Inmobiliario.Api.Features.WhatsApp.Services.LLMProviderFactory _providerFactory;
    private readonly CRM_Inmobiliario.Api.Features.AI.Services.IGeminiApiClient _geminiApiClient;
    private readonly string? _openAiApiKey;
    private readonly IServiceScopeFactory _scopeFactory;

    public WhatsAppAiService(
        ILogger<WhatsAppAiService> logger,
        IWhatsAppPromptBuilder promptBuilder,
        CRM_Inmobiliario.Api.Features.CoreAi.Services.ICoreAiToolExecutor toolExecutor,
        CRM_Inmobiliario.Api.Features.CoreAi.Services.ISemanticRouterService semanticRouterService,
        IWhatsAppMessageSender messageSender,
        IWhatsAppConversationManager conversationManager,
        IHttpClientFactory httpClientFactory,
        IDbContextFactory<CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext> dbContextFactory,
        CRM_Inmobiliario.Api.Features.WhatsApp.Services.LLMProviderFactory providerFactory,
        CRM_Inmobiliario.Api.Features.AI.Services.IGeminiApiClient geminiApiClient,
        IServiceScopeFactory scopeFactory)
    {
        _logger = logger;
        _promptBuilder = promptBuilder;
        _toolExecutor = toolExecutor;
        _semanticRouterService = semanticRouterService;
        _messageSender = messageSender;
        _conversationManager = conversationManager;
        _httpClientFactory = httpClientFactory;
        _dbContextFactory = dbContextFactory;
        _providerFactory = providerFactory;
        _geminiApiClient = geminiApiClient;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
        _scopeFactory = scopeFactory;
    }

    public async Task ProcessIncomingAudioAsync(string phone, byte[] audioBytes, string mediaUrl, string phoneNumberId, CancellationToken cancellationToken = default)
    {
        await ProcessMessageInternalAsync(phone, $"[Audio Note: {mediaUrl}]", phoneNumberId, audioBytes, mediaUrl, cancellationToken);
    }

    public async Task ProcessIncomingMessageAsync(string phone, string messageText, string phoneNumberId, CancellationToken cancellationToken = default)
    {
        await ProcessMessageInternalAsync(phone, messageText, phoneNumberId, null, null, cancellationToken);
    }

    private async Task ProcessMessageInternalAsync(string phone, string messageText, string phoneNumberId, byte[]? audioBytes, string? mediaUrl, CancellationToken cancellationToken)
    {
        try
        {
            await using var dbContextCheck = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
            var agente = await dbContextCheck.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == phoneNumberId, cancellationToken);
            if (agente == null) agente = await dbContextCheck.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin", cancellationToken);
            
            Contacto? contacto = null;
            if (agente != null)
            {
                bool autoCreate = agente.AutoCreateWhatsAppContacts || agente.IsWhatsAppAiEnabled;
                contacto = await _conversationManager.GetOrCreateContactAsync(phone, phoneNumberId, autoCreate, cancellationToken);
            }

            if (agente != null && !agente.IsWhatsAppAiEnabled)
            {
                _logger.LogInformation("WhatsApp AI is globally disabled for agent {AgentId}. Silently ignoring message from {Phone}.", agente.Id, phone);
                if (contacto != null)
                {
                    await _conversationManager.LogMessageAsync(contacto.Id, phone, "user", messageText, cancellationToken);
                }
                return;
            }

            _logger.LogInformation("Procesando mensaje de {Phone}: {Message}", phone, messageText);

            // 1. Preparar contexto (Contacto, Conversación, Historial, Filtros de Etapa)
            var context = await _conversationManager.PrepareContextAsync(contacto, phone, messageText, phoneNumberId, cancellationToken);
            
            // Logear mensaje del usuario en DB
            if (context.Contacto != null)
            {
                await _conversationManager.LogMessageAsync(context.Contacto.Id, phone, "user", messageText, cancellationToken);
            }

            // 2. Manejar respuesta automática de transferencia y Silence Mode
            if (context.AutoResponse != null)
            {
                if (!string.IsNullOrEmpty(context.AutoResponse))
                {
                    _logger.LogInformation("Contacto {Phone} en etapa restrictiva. Enviando auto-respuesta.", phone);
                    if (context.Contacto != null)
                    {
                        await _conversationManager.LogMessageAsync(context.Contacto.Id, phone, "assistant", context.AutoResponse, cancellationToken);
                    }
                    await _messageSender.SendWhatsAppMessageAsync(phone, context.AutoResponse, phoneNumberId, cancellationToken);
                }
                else
                {
                    _logger.LogInformation("Silence Mode activo para {Phone}. No se enviará respuesta.", phone);
                }
                return;
            }

            // 3. Orquestación con LLMProviderFactory
            await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
            var tenantAgent = await dbContext.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == phoneNumberId, cancellationToken);
            string rawProviderName = tenantAgent?.ActiveLLMProvider ?? "OpenAI";
            string apiKeyToUse = !string.IsNullOrEmpty(tenantAgent?.AiApiKey) 
                ? tenantAgent.AiApiKey 
                : (rawProviderName == "Gemini" ? Environment.GetEnvironmentVariable("GEMINI_API_KEY") : _openAiApiKey) ?? "";
            
            // Dynamic BYOK detection to ensure robustness
            string providerName = rawProviderName;
            if (!string.IsNullOrEmpty(apiKeyToUse))
            {
                if (apiKeyToUse.StartsWith("AIza", StringComparison.OrdinalIgnoreCase) || apiKeyToUse.StartsWith("AQ.", StringComparison.OrdinalIgnoreCase))
                    providerName = "Gemini";
                else if (apiKeyToUse.StartsWith("sk-", StringComparison.OrdinalIgnoreCase))
                    providerName = "OpenAI";
            }
            
            var provider = _providerFactory.GetProvider(providerName, apiKeyToUse);
            var history = context.History;
            var tools = CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts.AiToolDefinitions.GetTools("WhatsApp");

            // Semantic Router Evaluation
            var routerResult = await _semanticRouterService.DetermineIntentAsync(history, providerName, apiKeyToUse, cancellationToken);
            if (routerResult == CRM_Inmobiliario.Api.Features.CoreAi.Services.ChatIntent.NUEVA_BUSQUEDA || routerResult == CRM_Inmobiliario.Api.Features.CoreAi.Services.ChatIntent.CAMBIO_TEMA)
            {
                _conversationManager.ApplyNuevaBusqueda(history);
            }

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
                    _logger.LogWarning("Límite de iteraciones excedido para {Phone}. Activando Circuit Breaker.", phone);
                    finalResponse = "Ha ocurrido un fallo inesperado, le pido una disculpa por las molestias. Un agente humano le ayudará en unos momentos.";
                    
                    var execContextCb = new CRM_Inmobiliario.Api.Features.CoreAi.Services.ToolExecutionContext
                    {
                        UserId = context.Contacto?.Id ?? Guid.Empty,
                        Channel = "WhatsApp",
                        TriggerMessage = messageText,
                        CustomerPhone = phone,
                        PhoneNumberId = phoneNumberId,
                        ContactoId = context.Contacto?.Id
                    };
                    var fallbackToolCall = new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall { Id = "call_" + Guid.NewGuid().ToString("N"), Name = "SolicitarAsistenciaHumana", Arguments = "{\"motivo\":\"Activación de Circuit Breaker (Límite de iteraciones de IA excedido)\"}" };
                    await _toolExecutor.HandleToolCallAsync(fallbackToolCall, execContextCb, cancellationToken);
                    
                    history.Add(new ChatMessage(ChatRole.Assistant, finalResponse));
                    if (context.Contacto != null)
                    {
                        await _conversationManager.LogMessageAsync(context.Contacto.Id, phone, "assistant", finalResponse, cancellationToken);
                    }
                    requiresAction = false;
                    break;
                }

                var chatMessagesForAi = new List<ChatMessage>();
                
                if (history.Count > 0 && history[0].Role == ChatRole.System)
                {
                    chatMessagesForAi.Add(history[0]);
                    chatMessagesForAi.AddRange(history.Skip(1));
                }
                else
                {
                    chatMessagesForAi.AddRange(history);
                }

                _logger.LogInformation("--- ENVIANDO A LLM ({Count} mensajes en BD, {AiCount} enviados) ---", history.Count, chatMessagesForAi.Count);
                
                var aiHistory = WhatsAppHistoryMapper.MapToAiHistory(chatMessagesForAi, audioBytes, mediaUrl);

                requiresAction = false;
                
                var textBuilder = new System.Text.StringBuilder();
                var currentToolCalls = new Dictionary<string, CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall>();
                string? finishReason = null;
                
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
                            // Asegurarnos de que el ID no sea nulo si OpenAI no lo mandó, aunque normalmente viene en el primer chunk.
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
                    if (update.FinishReason != null)
                    {
                        finishReason = update.FinishReason;
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
                    history.Add(assistantMessage);

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
                                TriggerMessage = messageText,
                                CustomerPhone = phone,
                                PhoneNumberId = phoneNumberId,
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
                                    _logger.LogWarning("Circuit Breaker activado para {Phone}. Demasiados errores críticos de la IA.", phone);
                                    finalResponse = "Ha ocurrido un fallo inesperado, le pido una disculpa por las molestias. Un agente humano le ayudará en unos momentos.";
                                    
                                    // Invocar Asistencia Humana automáticamente
                                    var fallbackToolCall = new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall { Id = "call_" + Guid.NewGuid().ToString("N"), Name = "SolicitarAsistenciaHumana", Arguments = "{\"motivo\":\"Activación de Circuit Breaker (Errores críticos continuos de IA)\"}" };
                                    await _toolExecutor.HandleToolCallAsync(fallbackToolCall, res.ExecContext, linkedCts.Token);

                                    history.Add(new ChatMessage(ChatRole.Assistant, finalResponse));
                                    if (context.Contacto != null)
                                    {
                                        await _conversationManager.LogMessageAsync(context.Contacto.Id, phone, "assistant", finalResponse, linkedCts.Token);
                                    }
                                    requiresAction = false;
                                    break;
                                }
                            }

                            history.Add(new ChatMessage(ChatRole.Tool, res.Result) { Contents = { new FunctionResultContent(res.Call.Id, res.Result) } });
                        }
                        if (!requiresAction) break; // if circuit breaker hit
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
                        string agentName = tenantAgent != null ? $"{tenantAgent.Nombre} {tenantAgent.Apellido}".Trim() : "nuestro equipo";
                        string header = $"¡Hola! Soy el asistente virtual de {agentName} 🤖.\n\n";
                        string footer = $"\n\n💡 _Si prefieres atención personalizada, solo dímelo y {agentName} se conectará contigo._";
                        
                        finalResponse = header + finalResponse + footer;
                        history.Add(new ChatMessage(ChatRole.Assistant, finalResponse));
                    }
                    else
                    {
                        history.Add(new ChatMessage(ChatRole.Assistant, finalResponse));
                    }
                    
                    if (context.Contacto != null)
                    {
                        await _conversationManager.LogMessageAsync(context.Contacto.Id, phone, "assistant", finalResponse, cancellationToken);
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
                await _conversationManager.RecordTokenUsageAsync(context.Contacto.Id, 
                    total, 
                    input, 
                    cached, 
                    output,
                    providerName,
                    cancellationToken);
            }

            // 4. Persistir estado del historial
            if (context.Contacto != null)
            {
                await _conversationManager.SaveStateAsync(context.Contacto.Id, history, cancellationToken);
            }

            // 5. Enviar a WhatsApp con limpieza de formato
            if (!string.IsNullOrEmpty(finalResponse))
            {
                finalResponse = Regex.Replace(finalResponse, @"\*+", "*");
                await _messageSender.SendWhatsAppMessageAsync(phone, finalResponse, phoneNumberId, cancellationToken);
            }
        }
        catch (Polly.Timeout.TimeoutRejectedException)
        {
            _logger.LogError("Timeout excedido para {Phone} (Posible límite de cuota RPM alcanzado). El mensaje será reintentado automáticamente en background.", phone);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico en WhatsAppAiService para {Phone}", phone);
            throw;
        }
    }
}


