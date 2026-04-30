using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using System.Net.Http.Headers;
using System.Text.RegularExpressions;
using System.Text.Json;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public sealed class WhatsAppAiService
{
    private readonly CrmDbContext _context;
    private readonly ILogger<WhatsAppAiService> _logger;
    private readonly HttpClient _httpClient;
    private readonly IWhatsAppPromptBuilder _promptBuilder;
    private readonly IWhatsAppToolExecutor _toolExecutor;
    private readonly string? _openAiApiKey;
    private readonly string? _whatsappToken;
    private readonly string? _whatsappPhoneId;

    public WhatsAppAiService(
        CrmDbContext context,
        ILogger<WhatsAppAiService> logger,
        HttpClient httpClient,
        IWhatsAppPromptBuilder promptBuilder,
        IWhatsAppToolExecutor toolExecutor)
    {
        _context = context;
        _logger = logger;
        _httpClient = httpClient;
        _promptBuilder = promptBuilder;
        _toolExecutor = toolExecutor;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
        _whatsappToken = Environment.GetEnvironmentVariable("WHATSAPP_ACCESS_TOKEN")?.Trim().Trim('"');
        _whatsappPhoneId = Environment.GetEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID")?.Trim().Trim('"');
    }

    public async Task ProcessIncomingMessageAsync(string phone, string messageText)
    {
        try
        {
            _logger.LogInformation("Procesando mensaje de {Phone}: {Message}", phone, messageText);

            // 1. Obtener o crear conversación y buscar al Lead de forma inteligente
            var conversation = await _context.WhatsappConversations
                .FirstOrDefaultAsync(c => c.Telefono == phone);
            
            // Búsqueda inteligente: WhatsApp manda sin +, la DB puede tener +
            string searchPhone = phone.StartsWith("+") ? phone : "+" + phone;
            var lead = await _context.Leads.AsNoTracking()
                .FirstOrDefaultAsync(l => l.Telefono == phone || l.Telefono == searchPhone);
            
            // --- FILTRADO POR ETAPA (Ahorro de Tokens y Atención Humana) ---
            if (lead != null)
            {
                string? autoMsg = null;

                if (lead.EtapaEmbudo == "En Negociación")
                {
                    _logger.LogInformation("Lead {Phone} está en Negociación. Enviando respuesta automática.", phone);
                    autoMsg = "*Mensaje Automático:* Hola, hemos recibido tu mensaje. Como te encuentras en proceso de negociación, un asesor humano se contactará contigo en unos momentos para darte una atención personalizada. ¡Gracias por tu paciencia!";
                }
                else if (lead.EtapaEmbudo == "Cerrado")
                {
                    _logger.LogInformation("Lead {Phone} está Cerrado. Enviando respuesta automática.", phone);
                    autoMsg = "*Mensaje Automático:* ¡Hola de nuevo! Es un gusto saludarte. Veo que ya hemos finalizado un proceso exitoso anteriormente. Un asesor se comunicará contigo en breve para asistirte con tus nuevos requerimientos inmobiliarios. ¡Gracias por elegirnos nuevamente!";
                }

                if (autoMsg != null)
                {
                    _context.WhatsappMessages.Add(new WhatsappMessage { Id = Guid.NewGuid(), Telefono = phone, Rol = "user", Contenido = messageText, Fecha = DateTimeOffset.UtcNow });
                    _context.WhatsappMessages.Add(new WhatsappMessage { Id = Guid.NewGuid(), Telefono = phone, Rol = "assistant", Contenido = autoMsg, Fecha = DateTimeOffset.UtcNow });
                    
                    await _context.SaveChangesAsync();
                    await SendWhatsAppMessageAsync(phone, autoMsg);
                    return;
                }
            }

            var leadExists = lead != null;

            List<ChatMessage> history;
            if (conversation == null)
            {
                history = new List<ChatMessage> { new SystemChatMessage(_promptBuilder.GetSystemPrompt(leadExists, lead?.Nombre)) };
                conversation = new WhatsappConversation
                {
                    Telefono = phone,
                    HistorialJson = _promptBuilder.SerializeHistory(history),
                    UltimaActualizacion = DateTimeOffset.UtcNow
                };
                _context.WhatsappConversations.Add(conversation);
            }
            else
            {
                history = _promptBuilder.DeserializeHistory(conversation.HistorialJson, leadExists, lead?.Nombre);
            }

            // 2. Añadir mensaje del usuario a la historia y a la base de datos
            history.Add(new UserChatMessage(messageText));
            
            _context.WhatsappMessages.Add(new WhatsappMessage 
            { 
                Id = Guid.NewGuid(),
                Telefono = phone, 
                Rol = "user", 
                Contenido = messageText, 
                Fecha = DateTimeOffset.UtcNow 
            });

            // --- CONTROL DE COSTOS (INPUT): Ventana deslizante de historial ---
            if (history.Count > 12) 
            {
                var systemMessage = history[0];
                history = history.Skip(history.Count - 10).ToList();
                history.Insert(0, systemMessage);
            }

            // 3. Inferencia con OpenAI y Function Calling
            var chatClient = new ChatClient("gpt-4o-mini", _openAiApiKey);
            var options = _promptBuilder.GetChatOptions();

            bool requiresAction = true;
            string? finalResponse = null;

            while (requiresAction)
            {
                _logger.LogInformation("--- ENVIANDO A OPENAI (Historia acumulada: {Count} mensajes) ---", history.Count);
                
                ChatCompletion completion = await chatClient.CompleteChatAsync(history, options);
                requiresAction = false;

                _logger.LogInformation("--- CONSUMO DE TOKENS: Input={Input}, Output={Output}, Total={Total} ---", 
                    completion.Usage.InputTokenCount, completion.Usage.OutputTokenCount, completion.Usage.TotalTokenCount);

                switch (completion.FinishReason)
                {
                    case ChatFinishReason.Stop:
                        finalResponse = completion.Content[0].Text;
                        history.Add(new AssistantChatMessage(completion));
                        
                        _context.WhatsappMessages.Add(new WhatsappMessage 
                        { 
                            Id = Guid.NewGuid(),
                            Telefono = phone, 
                            Rol = "assistant", 
                            Contenido = finalResponse, 
                            Fecha = DateTimeOffset.UtcNow 
                        });

                        _logger.LogInformation("--- RESPUESTA FINAL IA: {Response} ---", finalResponse);
                        break;

                    case ChatFinishReason.ToolCalls:
                        history.Add(new AssistantChatMessage(completion.ToolCalls));
                        foreach (var toolCall in completion.ToolCalls)
                        {
                            _logger.LogInformation("--- IA DECIDIÓ LLAMAR A: {Tool} con ARGS: {Args} ---", toolCall.FunctionName, toolCall.FunctionArguments);
                            string toolResult = await _toolExecutor.HandleToolCallAsync(toolCall, phone, messageText, lead);
                            _logger.LogInformation("--- RESULTADO DE LA HERRAMIENTA: {Result} ---", toolResult);
                            history.Add(new ToolChatMessage(toolCall.Id, toolResult));
                        }
                        requiresAction = true;
                        break;
                }
            }

            // 4. Guardar historial y mensajes actualizados
            conversation.HistorialJson = _promptBuilder.SerializeHistory(history);
            conversation.UltimaActualizacion = DateTimeOffset.UtcNow;
            
            _logger.LogInformation("Guardando cambios en DB para {Phone}...", phone);
            await _context.SaveChangesAsync();
            _logger.LogInformation("DB actualizada correctamente para {Phone}.", phone);

            // 5. Enviar respuesta a WhatsApp
            if (!string.IsNullOrEmpty(finalResponse))
            {
                // Limpieza agresiva: Convertir cualquier secuencia de asteriscos (**, ***, etc) en uno solo.
                finalResponse = Regex.Replace(finalResponse, @"\*+", "*");
                
                await SendWhatsAppMessageAsync(phone, finalResponse);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error crítico procesando mensaje de WhatsApp para {Phone}", phone);
        }
    }

    private async Task SendWhatsAppMessageAsync(string to, string text)
    {
        if (string.IsNullOrEmpty(_whatsappToken) || string.IsNullOrEmpty(_whatsappPhoneId)) return;

        var url = $"https://graph.facebook.com/v19.0/{_whatsappPhoneId}/messages";
        var payload = new
        {
            messaging_product = "whatsapp",
            to = to,
            type = "text",
            text = new { body = text }
        };

        var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _whatsappToken);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), System.Text.Encoding.UTF8, "application/json");

        await _httpClient.SendAsync(request);
    }
}
