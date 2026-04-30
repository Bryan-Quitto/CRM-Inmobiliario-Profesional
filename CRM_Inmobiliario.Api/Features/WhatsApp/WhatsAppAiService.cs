using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using System.Text.RegularExpressions;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public sealed class WhatsAppAiService
{
    private readonly ILogger<WhatsAppAiService> _logger;
    private readonly IWhatsAppPromptBuilder _promptBuilder;
    private readonly IWhatsAppToolExecutor _toolExecutor;
    private readonly IWhatsAppMessageSender _messageSender;
    private readonly IWhatsAppConversationManager _conversationManager;
    private readonly string? _openAiApiKey;

    public WhatsAppAiService(
        ILogger<WhatsAppAiService> logger,
        IWhatsAppPromptBuilder promptBuilder,
        IWhatsAppToolExecutor toolExecutor,
        IWhatsAppMessageSender messageSender,
        IWhatsAppConversationManager conversationManager)
    {
        _logger = logger;
        _promptBuilder = promptBuilder;
        _toolExecutor = toolExecutor;
        _messageSender = messageSender;
        _conversationManager = conversationManager;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
    }

    public async Task ProcessIncomingMessageAsync(string phone, string messageText)
    {
        try
        {
            _logger.LogInformation("Procesando mensaje de {Phone}: {Message}", phone, messageText);

            // 1. Preparar contexto (Lead, Conversación, Historial, Filtros de Etapa)
            var context = await _conversationManager.PrepareContextAsync(phone, messageText);
            
            // Logear mensaje del usuario en DB
            await _conversationManager.LogMessageAsync(phone, "user", messageText);

            // 2. Manejar respuesta automática por etapa (Negociación/Cerrado)
            if (context.AutoResponse != null)
            {
                _logger.LogInformation("Lead {Phone} en etapa restrictiva. Enviando auto-respuesta.", phone);
                await _conversationManager.LogMessageAsync(phone, "assistant", context.AutoResponse);
                await _messageSender.SendWhatsAppMessageAsync(phone, context.AutoResponse);
                return;
            }

            // 3. Orquestación con OpenAI GPT-4o-mini
            var chatClient = new ChatClient("gpt-4o-mini", _openAiApiKey);
            var options = _promptBuilder.GetChatOptions();
            var history = context.History;

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
                            string toolResult = await _toolExecutor.HandleToolCallAsync(toolCall, phone, messageText, context.Lead);
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
                await _messageSender.SendWhatsAppMessageAsync(phone, finalResponse);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico en WhatsAppAiService para {Phone}", phone);
        }
    }
}
