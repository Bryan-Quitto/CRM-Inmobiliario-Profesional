using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using OpenAI;
using System.ClientModel.Primitives;
using System.Text.RegularExpressions;
using Pgvector.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public sealed class WhatsAppAiService
{
    private readonly ILogger<WhatsAppAiService> _logger;
    private readonly IWhatsAppPromptBuilder _promptBuilder;
    private readonly IWhatsAppToolExecutor _toolExecutor;
    private readonly IWhatsAppMessageSender _messageSender;
    private readonly IWhatsAppConversationManager _conversationManager;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext _dbContext;
    private readonly string? _openAiApiKey;

    public WhatsAppAiService(
        ILogger<WhatsAppAiService> logger,
        IWhatsAppPromptBuilder promptBuilder,
        IWhatsAppToolExecutor toolExecutor,
        IWhatsAppMessageSender messageSender,
        IWhatsAppConversationManager conversationManager,
        IHttpClientFactory httpClientFactory,
        CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext dbContext)
    {
        _logger = logger;
        _promptBuilder = promptBuilder;
        _toolExecutor = toolExecutor;
        _messageSender = messageSender;
        _conversationManager = conversationManager;
        _httpClientFactory = httpClientFactory;
        _dbContext = dbContext;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
    }

    public async Task ProcessIncomingMessageAsync(string phone, string messageText, string phoneNumberId)
    {
        try
        {
            _logger.LogInformation("Procesando mensaje de {Phone}: {Message}", phone, messageText);

            // 1. Preparar contexto (Contacto, Conversación, Historial, Filtros de Etapa)
            var context = await _conversationManager.PrepareContextAsync(phone, messageText, phoneNumberId);
            
            // Logear mensaje del usuario en DB
            await _conversationManager.LogMessageAsync(phone, "user", messageText);

            // 2. Manejar respuesta automática de transferencia y Silence Mode
            if (context.AutoResponse != null)
            {
                if (!string.IsNullOrEmpty(context.AutoResponse))
                {
                    _logger.LogInformation("Contacto {Phone} en etapa restrictiva. Enviando auto-respuesta.", phone);
                    await _conversationManager.LogMessageAsync(phone, "assistant", context.AutoResponse);
                    await _messageSender.SendWhatsAppMessageAsync(phone, context.AutoResponse, phoneNumberId);
                }
                else
                {
                    _logger.LogInformation("Silence Mode activo para {Phone}. No se enviará respuesta.", phone);
                }
                return;
            }

            // 3. Orquestación con OpenAI GPT-4o-mini
            var httpClient = _httpClientFactory.CreateClient("OpenAI");
            var clientOptions = new OpenAIClientOptions
            {
                Transport = new HttpClientPipelineTransport(httpClient)
            };
            
            var tenantAgent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == phoneNumberId);
            string apiKeyToUse = tenantAgent?.AiApiKey ?? _openAiApiKey ?? "";
            var chatClient = new ChatClient("gpt-4o-mini", new System.ClientModel.ApiKeyCredential(apiKeyToUse), clientOptions);
            
            // 3.1 Clasificación de Intención
            var intentPrompt = @"Clasifica el siguiente mensaje del usuario en una de dos categorías:
1. 'CORPORATE': Si el usuario pregunta sobre políticas internas, requisitos, comisiones, reglas de la inmobiliaria o temas administrativos.
2. 'PROPERTY': Si el usuario busca propiedades, pide agendar visitas, o cualquier otra cosa.
Responde ÚNICAMENTE con la palabra 'CORPORATE' o 'PROPERTY'.";
            var intentResponse = await chatClient.CompleteChatAsync(new List<ChatMessage> {
                new SystemChatMessage(intentPrompt),
                new UserChatMessage(messageText)
            });
            
            var history = context.History;
            
            if (intentResponse.Value.Content[0].Text.Trim().ToUpper() == "CORPORATE")
            {
                _logger.LogInformation("Intención CORPORATE detectada para {Phone}.", phone);
                
                var embeddingClient = new OpenAI.Embeddings.EmbeddingClient("text-embedding-3-small", apiKeyToUse);
                var embeddingResult = await embeddingClient.GenerateEmbeddingAsync(messageText);
                var queryVector = new Pgvector.Vector(embeddingResult.Value.ToFloats().ToArray());
                
                var baseQuery = _dbContext.DocumentChunks
                    .Where(c => c.Audience == DocumentAudience.Public);

                var topChunks = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.ToListAsync(
                    System.Linq.Queryable.Take(
                        System.Linq.Queryable.OrderBy(
                            baseQuery,
                            c => c.Embedding!.CosineDistance(queryVector)
                        ),
                        3
                    )
                );
                
                if (topChunks.Any())
                {
                    string contextText = string.Join("\n\n", topChunks.Select(c => $"[Contexto]: {c.Content}"));
                    string ragPrompt = $"Eres el asistente virtual de la inmobiliaria. Responde a la pregunta del usuario basándote ESTRICTAMENTE en la siguiente información proporcionada. Si la respuesta no se encuentra en esta información, indica amablemente que no tienes los datos y sugiere contactar a un asesor humano. NO inventes información.\n\n{contextText}";
                    
                    // Modify the system prompt to be the RAG prompt
                    if (history.Count > 0 && history[0] is SystemChatMessage)
                    {
                        history[0] = new SystemChatMessage(ragPrompt);
                    }
                }
            }

            var options = _promptBuilder.GetChatOptions();

            bool requiresAction = true;
            string? finalResponse = null;

            while (requiresAction)
            {
                _logger.LogInformation("--- ENVIANDO A OPENAI ({Count} mensajes) ---", history.Count);
                
                ChatCompletion completion = await chatClient.CompleteChatAsync(history, options);
                requiresAction = false;

                _logger.LogInformation("--- TOKENS: Input={Input}, Output={Output}, Total={Total} ---", 
                    completion.Usage.InputTokenCount, completion.Usage.OutputTokenCount, completion.Usage.TotalTokenCount);

                switch (completion.FinishReason)
                {
                    case ChatFinishReason.Stop:
                        finalResponse = completion.Content[0].Text;
                        history.Add(new AssistantChatMessage(completion));
                        
                        await _conversationManager.LogMessageAsync(phone, "assistant", finalResponse);
                        _logger.LogInformation("--- RESPUESTA FINAL IA: {Response} ---", finalResponse);
                        break;

                    case ChatFinishReason.ToolCalls:
                        history.Add(new AssistantChatMessage(completion.ToolCalls));
                        foreach (var toolCall in completion.ToolCalls)
                        {
                            _logger.LogInformation("--- TOOL CALL: {Tool} ---", toolCall.FunctionName);
                            string toolResult = await _toolExecutor.HandleToolCallAsync(toolCall, phone, messageText, context.Contacto, phoneNumberId);
                            history.Add(new ToolChatMessage(toolCall.Id, toolResult));
                        }
                        requiresAction = true;
                        break;
                }
            }

            // 4. Persistir estado del historial
            await _conversationManager.SaveStateAsync(phone, history);

            // 5. Enviar a WhatsApp con limpieza de formato
            if (!string.IsNullOrEmpty(finalResponse))
            {
                finalResponse = Regex.Replace(finalResponse, @"\*+", "*");
                await _messageSender.SendWhatsAppMessageAsync(phone, finalResponse, phoneNumberId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico en WhatsAppAiService para {Phone}", phone);
            throw;
        }
    }
}
