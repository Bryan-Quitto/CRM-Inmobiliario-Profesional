using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;
using OpenAI;
using System.ClientModel.Primitives;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public sealed class WhatsAppConversationManager : IWhatsAppConversationManager
{
    private readonly CrmDbContext _context;
    private readonly ILogger<WhatsAppConversationManager> _logger;
    private readonly IWhatsAppPromptBuilder _promptBuilder;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;
    private readonly System.Net.Http.IHttpClientFactory _httpClientFactory;

    public WhatsAppConversationManager(
        CrmDbContext context, 
        ILogger<WhatsAppConversationManager> logger,
        IWhatsAppPromptBuilder promptBuilder,
        Microsoft.Extensions.Configuration.IConfiguration config,
        System.Net.Http.IHttpClientFactory httpClientFactory)
    {
        _context = context;
        _logger = logger;
        _promptBuilder = promptBuilder;
        _config = config;
        _httpClientFactory = httpClientFactory;
    }

    public async Task<WhatsAppContext> PrepareContextAsync(string phone, string messageText)
    {
        // 1. Búsqueda inteligente del Contacto
        string searchPhone = phone.StartsWith("+") ? phone : "+" + phone;
        var contacto = await _context.Contactos.AsNoTracking()
            .FirstOrDefaultAsync(l => l.Telefono == phone || l.Telefono == searchPhone);
        
        // 2. Filtrado por BotActivo y Reglas de Handoff
        string? autoMsg = null;
        if (contacto != null)
        {
            // Regla: Si es solo propietario (no prospecto), requiere asistencia humana inmediata
            if (contacto.EsPropietario && !contacto.EsProspecto && contacto.BotActivo)
            {
                contacto.BotActivo = false;
                await _context.Contactos
                    .Where(c => c.Id == contacto.Id)
                    .ExecuteUpdateAsync(s => s.SetProperty(c => c.BotActivo, false));
            }

            if (!contacto.BotActivo)
            {
                if (!contacto.TransferenciaNotificada)
                {
                    autoMsg = "En este momento se está transfiriendo a uno de nuestros agentes humanos para que le atienda personalmente.";
                    
                    await _context.Contactos
                        .Where(c => c.Id == contacto.Id)
                        .ExecuteUpdateAsync(s => s.SetProperty(c => c.TransferenciaNotificada, true));
                }
                else
                {
                    autoMsg = string.Empty; // Silence Mode
                }
            }
        }

        // 3. Obtener o crear conversación
        var conversation = await _context.WhatsappConversations
            .FirstOrDefaultAsync(c => c.Telefono == phone);
        
        List<ChatMessage> history;
        bool contactExists = contacto != null;

        if (conversation == null)
        {
            history = new List<ChatMessage> { new SystemChatMessage(_promptBuilder.GetSystemPrompt(contactExists, contacto?.Nombre)) };
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
            history = _promptBuilder.DeserializeHistory(conversation.HistorialJson, contactExists, contacto?.Nombre);
            
            // Reemplazar siempre el prompt del sistema antiguo con la versión más reciente del código
            if (history.Count > 0 && history[0] is SystemChatMessage)
            {
                history[0] = new SystemChatMessage(_promptBuilder.GetSystemPrompt(contactExists, contacto?.Nombre));
            }
        }

        // 4. Añadir mensaje del usuario a la historia
        history.Add(new UserChatMessage(messageText));

        // 5. Compresión Semántica de Memoria (Largo Plazo)
        if (history.Count > 12) 
        {
            var systemMessage = history[0];
            var messagesToCompress = history.Skip(1).Take(6).ToList();
            
            try 
            {
                var httpClient = _httpClientFactory.CreateClient("OpenAI");
                var clientOptions = new OpenAIClientOptions
                {
                    Transport = new HttpClientPipelineTransport(httpClient)
                };
                var chatClient = new ChatClient("gpt-4o-mini", new System.ClientModel.ApiKeyCredential(_config["OPENAI_API_KEY"] ?? ""), clientOptions);
                var promptStr = "Resume esta interacción para la memoria del sistema. Enfócate SOLO en DATOS DUROS del cliente: " +
                                "Qué busca, Presupuesto, Ubicaciones, y qué propiedades le gustaron o rechazó. Omite saludos. Formato de viñetas muy denso.";
                
                var plainTextHistory = string.Join("\n", messagesToCompress.Select(m => {
                    var role = m is UserChatMessage ? "Cliente" : m is SystemChatMessage ? "Memoria" : "IA";
                    var text = m.Content.Count > 0 ? m.Content[0].Text : "[Uso de Herramienta]";
                    return $"{role}: {text}";
                }));

                var compressionMessages = new List<ChatMessage> { 
                    new SystemChatMessage(promptStr),
                    new UserChatMessage(plainTextHistory)
                };
                
                var response = await chatClient.CompleteChatAsync(compressionMessages);
                var resumen = response.Value.Content[0].Text;
                
                var newHistory = new List<ChatMessage> { systemMessage };
                newHistory.Add(new SystemChatMessage($"[MEMORIA HISTÓRICA DEL CLIENTE]:\n{resumen}"));
                
                var tail = history.Skip(7).ToList();
                // Limpiar posibles mensajes de herramientas huérfanos al inicio del tail
                while (tail.Count > 0 && tail[0] is ToolChatMessage)
                {
                    tail.RemoveAt(0);
                }
                newHistory.AddRange(tail);
                
                history = newHistory;
                _logger.LogInformation("Historial comprimido semánticamente. Nuevo tamaño: {Count}", history.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fallo en compresión semántica. Usando truncado clásico.");
                history = history.Skip(history.Count - 10).ToList();
                history.Insert(0, systemMessage);
            }
        }

        return new WhatsAppContext(contacto, conversation, history, autoMsg);
    }

    public async Task SaveStateAsync(string phone, List<ChatMessage> history)
    {
        var conversation = await _context.WhatsappConversations
            .FirstOrDefaultAsync(c => c.Telefono == phone);

        if (conversation != null)
        {
            conversation.HistorialJson = _promptBuilder.SerializeHistory(history);
            conversation.UltimaActualizacion = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync();
        }
    }

    public async Task LogMessageAsync(string phone, string role, string content)
    {
        _context.WhatsappMessages.Add(new WhatsappMessage 
        { 
            Id = Guid.NewGuid(),
            Telefono = phone, 
            Rol = role, 
            Contenido = content, 
            Fecha = DateTimeOffset.UtcNow 
        });
        await _context.SaveChangesAsync();
    }
}
