using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using System.ClientModel.Primitives;
using System.Text.RegularExpressions;
using Pgvector.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public enum ChatIntent
{
    NUEVA_BUSQUEDA,
    CAMBIO_TEMA,
    CONTINUACION
}

public class SemanticRouterResponse
{
    public ChatIntent Intent { get; set; }
}

public sealed class WhatsAppAiService
{
    private readonly ILogger<WhatsAppAiService> _logger;
    private readonly IWhatsAppPromptBuilder _promptBuilder;
    private readonly IWhatsAppToolExecutor _toolExecutor;
    private readonly IWhatsAppMessageSender _messageSender;
    private readonly IWhatsAppConversationManager _conversationManager;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext _dbContext;
    private readonly CRM_Inmobiliario.Api.Features.WhatsApp.Services.LLMProviderFactory _providerFactory;
    private readonly CRM_Inmobiliario.Api.Features.AI.Services.IGeminiApiClient _geminiApiClient;
    private readonly CRM_Inmobiliario.Api.Features.AI.Services.IDatasetProvider _datasetProvider;
    private readonly string? _openAiApiKey;

    public WhatsAppAiService(
        ILogger<WhatsAppAiService> logger,
        IWhatsAppPromptBuilder promptBuilder,
        IWhatsAppToolExecutor toolExecutor,
        IWhatsAppMessageSender messageSender,
        IWhatsAppConversationManager conversationManager,
        IHttpClientFactory httpClientFactory,
        CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext dbContext,
        CRM_Inmobiliario.Api.Features.WhatsApp.Services.LLMProviderFactory providerFactory,
        CRM_Inmobiliario.Api.Features.AI.Services.IGeminiApiClient geminiApiClient,
        CRM_Inmobiliario.Api.Features.AI.Services.IDatasetProvider datasetProvider)
    {
        _logger = logger;
        _promptBuilder = promptBuilder;
        _toolExecutor = toolExecutor;
        _messageSender = messageSender;
        _conversationManager = conversationManager;
        _httpClientFactory = httpClientFactory;
        _dbContext = dbContext;
        _providerFactory = providerFactory;
        _geminiApiClient = geminiApiClient;
        _datasetProvider = datasetProvider;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
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
            _logger.LogInformation("Procesando mensaje de {Phone}: {Message}", phone, messageText);

            // 1. Preparar contexto (Contacto, Conversación, Historial, Filtros de Etapa)
            var context = await _conversationManager.PrepareContextAsync(phone, messageText, phoneNumberId);
            
            // Logear mensaje del usuario en DB
            if (context.Contacto != null)
            {
                await _conversationManager.LogMessageAsync(context.Contacto.Id, phone, "user", messageText);
            }

            // 2. Manejar respuesta automática de transferencia y Silence Mode
            if (context.AutoResponse != null)
            {
                if (!string.IsNullOrEmpty(context.AutoResponse))
                {
                    _logger.LogInformation("Contacto {Phone} en etapa restrictiva. Enviando auto-respuesta.", phone);
                    if (context.Contacto != null)
                    {
                        await _conversationManager.LogMessageAsync(context.Contacto.Id, phone, "assistant", context.AutoResponse);
                    }
                    await _messageSender.SendWhatsAppMessageAsync(phone, context.AutoResponse, phoneNumberId);
                }
                else
                {
                    _logger.LogInformation("Silence Mode activo para {Phone}. No se enviará respuesta.", phone);
                }
                return;
            }

            // 3. Orquestación con LLMProviderFactory
            var tenantAgent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == phoneNumberId);
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
            
            string? cachedContentId = null;
            if (providerName == "Gemini" && tenantAgent != null && tenantAgent.HasActiveSubscription)
            {
                // TODO: Remove this temporary cache invalidation after test
                if (tenantAgent.GeminiCacheId == "cachedContents/bcga390rwlpc2kazb4egb48kxnxgex9gdxqitvm9")
                {
                    tenantAgent.GeminiCacheId = null;
                }

                if (string.IsNullOrEmpty(tenantAgent.GeminiCacheId) || 
                    !tenantAgent.GeminiCacheExpiresAt.HasValue || 
                    tenantAgent.GeminiCacheExpiresAt.Value < DateTimeOffset.UtcNow)
                {
                    _logger.LogInformation("Creando/Renovando caché de Gemini para agente {AgentId}", tenantAgent.Id);
                    var sysInstruction = _datasetProvider.GetSystemInstruction();
                    var datasetContents = _datasetProvider.GetDatasetContents();
                    
                    if (sysInstruction != null && datasetContents != null && datasetContents.Count > 0)
                    {
                        var aiTools = CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts.AiToolDefinitions.GetTools();
                        var toolsList = new List<Google.GenAI.Types.Tool>();
                        var functionDeclarations = new List<Google.GenAI.Types.FunctionDeclaration>();
                        foreach (var t in aiTools)
                        {
                            functionDeclarations.Add(new Google.GenAI.Types.FunctionDeclaration
                            {
                                Name = t.Name,
                                Description = t.Description,
                                Parameters = CRM_Inmobiliario.Api.Features.WhatsApp.Services.Providers.GeminiSchemaMapper.ParseSchema(t.ParametersSchema)
                            });
                        }
                        if (functionDeclarations.Count > 0)
                        {
                            toolsList.Add(new Google.GenAI.Types.Tool { FunctionDeclarations = functionDeclarations });
                        }

                        var newCacheId = await _geminiApiClient.CreateCachedContentAsync(apiKeyToUse, sysInstruction, datasetContents, toolsList);
                        if (!string.IsNullOrEmpty(newCacheId))
                        {
                            tenantAgent.GeminiCacheId = newCacheId;
                            tenantAgent.GeminiCacheExpiresAt = DateTimeOffset.UtcNow.AddHours(1);
                            await _dbContext.SaveChangesAsync();
                            cachedContentId = newCacheId;
                            _logger.LogInformation("Gemini Cache creado exitosamente: {CacheId}", newCacheId);
                        }
                    }
                }
                else
                {
                    cachedContentId = tenantAgent.GeminiCacheId;
                    _logger.LogInformation("Usando Gemini Cache existente: {CacheId}", cachedContentId);
                }
            }

            var provider = _providerFactory.GetProvider(providerName, apiKeyToUse);
            var history = context.History;
            var tools = CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts.AiToolDefinitions.GetTools();

            // Semantic Router Evaluation
            if (history.Count > 1)
            {
                var routerMessages = new List<CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage>
                {
                    new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage 
                    { 
                        Role = "system", 
                        Content = "Evalúa la intención de la última interacción del usuario. Responde con la propiedad 'intent'. Valores posibles: 'NUEVA_BUSQUEDA' (si pide buscar propiedades diferentes, cambia de ciudad/sector, o quiere empezar de cero), 'CAMBIO_TEMA' (si cambia de tema por completo) o 'CONTINUACION' (si es una respuesta a una pregunta, aporta más detalles a la búsqueda actual, o pregunta por una de las propiedades enviadas). No uses ningún otro formato ni expliques nada." 
                    }
                };
                
                var lastMessages = history.Where(m => m.Role == ChatRole.User || m.Role == ChatRole.Assistant)
                                            .Where(m => !m.Contents.Any(c => c is FunctionCallContent))
                                            .TakeLast(3).ToList();
                
                foreach(var m in lastMessages)
                {
                    var roleStr = m.Role == ChatRole.User ? "user" : "assistant";
                    var content = m.Text ?? "";
                    routerMessages.Add(new CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiMessage { Role = roleStr, Content = content });
                }
                
                var routerProvider = _providerFactory.GetProvider("Gemini", Environment.GetEnvironmentVariable("GEMINI_API_KEY") ?? apiKeyToUse, "gemini-2.5-flash-lite");
                
                var routerResultWrapper = await routerProvider.GetStructuredResponseAsync<SemanticRouterResponse>(routerMessages, cancellationToken);
                var routerResult = routerResultWrapper?.Intent ?? ChatIntent.CONTINUACION;
                
                if (routerResult == ChatIntent.NUEVA_BUSQUEDA || routerResult == ChatIntent.CAMBIO_TEMA)
                {
                    _logger.LogInformation("Semantic Router: {Intent} detectada. Limpiando parámetros.", routerResult.ToString());
                    _conversationManager.ApplyNuevaBusqueda(history);
                }
                else
                {
                    _logger.LogInformation("Semantic Router: CONTINUACION detectada. Resultado: {Result}", routerResult.ToString());
                }
            }

            bool requiresAction = true;
            string? finalResponse = null;

            while (requiresAction)
            {
                var chatMessagesForAi = new List<ChatMessage>();
                
                if (history.Count > 0 && history[0].Role == ChatRole.System)
                {
                    chatMessagesForAi.Add(history[0]);
                    
                    // Comentado para no forzar la personalidad de los Golden Examples (evita el "Hola" repetitivo y confía más en el modelo moderno)
                    // chatMessagesForAi.AddRange(CRM_Inmobiliario.Api.Features.WhatsApp.Services.AiPromptConstants.GoldenExamples);
                    
                    // El Context Caching se encargará de inyectar el dataset en Google.
                    // Hemos desactivado el fallback de inyectar el dataset completo en línea para ahorrar 45k tokens por mensaje.
                    
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
                CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models.AiToolCall? currentToolCall = null;
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

                await foreach(var update in provider.StreamChatAsync(aiHistory, tools, cachedContentId, cancellationToken: cancellationToken))
                {
                    if (!string.IsNullOrEmpty(update.TextUpdate))
                    {
                        textBuilder.Append(update.TextUpdate);
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
                    _logger.LogInformation("--- CONSUMO DE TOKENS --- Total: {Total} | Input: {Input} | Cached: {Cached} | Output: {Output}", 
                        streamTotalTokens.Value, streamInputTokens ?? 0, streamCachedTokens ?? 0, streamOutputTokens ?? 0);

                    await _conversationManager.RecordTokenUsageAsync(context.Contacto.Id, 
                        streamTotalTokens.Value, 
                        streamInputTokens ?? 0, 
                        streamCachedTokens ?? 0, 
                        streamOutputTokens ?? 0);
                }

                if (currentToolCall != null)
                {
                    var argsDict = System.Text.Json.JsonSerializer.Deserialize<IDictionary<string, object?>>(currentToolCall.Arguments);
                    var chatToolCall = new FunctionCallContent(currentToolCall.Id, currentToolCall.Name, argsDict);
                    history.Add(new ChatMessage(ChatRole.Assistant, "") { Contents = { chatToolCall } });
                    
                    _logger.LogInformation("--- TOOL CALL: {Tool} ---", currentToolCall.Name);
                    string toolResult = await _toolExecutor.HandleToolCallAsync(currentToolCall, phone, messageText, context.Contacto, phoneNumberId);
                    history.Add(new ChatMessage(ChatRole.Tool, toolResult) { Contents = { new FunctionResultContent(currentToolCall.Id, toolResult) } });
                    
                    requiresAction = true;
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
                        await _conversationManager.LogMessageAsync(context.Contacto.Id, phone, "assistant", finalResponse);
                    }
                    _logger.LogInformation("--- RESPUESTA FINAL IA: {Response} ---", finalResponse);
                }
            }

            // 4. Persistir estado del historial
            if (context.Contacto != null)
            {
                await _conversationManager.SaveStateAsync(context.Contacto.Id, history);
            }

            // 5. Enviar a WhatsApp con limpieza de formato
            if (!string.IsNullOrEmpty(finalResponse))
            {
                finalResponse = Regex.Replace(finalResponse, @"\*+", "*");
                await _messageSender.SendWhatsAppMessageAsync(phone, finalResponse, phoneNumberId);
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
