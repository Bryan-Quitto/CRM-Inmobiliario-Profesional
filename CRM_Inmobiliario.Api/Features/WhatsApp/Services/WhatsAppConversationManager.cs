using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using OpenAI.Chat;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public sealed class WhatsAppConversationManager : IWhatsAppConversationManager
{
    private readonly CrmDbContext _context;
    private readonly ILogger<WhatsAppConversationManager> _logger;
    private readonly IWhatsAppPromptBuilder _promptBuilder;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;

    public WhatsAppConversationManager(
        CrmDbContext context, 
        ILogger<WhatsAppConversationManager> logger,
        IWhatsAppPromptBuilder promptBuilder,
        Microsoft.Extensions.Configuration.IConfiguration config)
    {
        _context = context;
        _logger = logger;
        _promptBuilder = promptBuilder;
        _config = config;
    }

    public async Task<WhatsAppContext> PrepareContextAsync(string phone, string messageText)
    {
        // 1. Búsqueda inteligente del Contacto
        string searchPhone = phone.StartsWith("+") ? phone : "+" + phone;
        var contacto = await _context.Contactos.AsNoTracking()
            .FirstOrDefaultAsync(l => l.Telefono == phone || l.Telefono == searchPhone);
        
        // 2. Filtrado por Etapa o Rol
        string? autoMsg = null;
        if (contacto != null)
        {
            if (contacto.EsPropietario && !contacto.EsProspecto)
            {
                autoMsg = "*Mensaje Automático:* ¡Hola! Veo que eres uno de nuestros propietarios. Un agente humano se contactará contigo enseguida para tratar temas de tu inmueble. ¡Gracias por tu paciencia!";
            }
            else if (contacto.EtapaEmbudo == "En Negociación")
            {
                autoMsg = "*Mensaje Automático:* Hola, hemos recibido tu mensaje. Como te encuentras en proceso de negociación, un asesor humano se contactará contigo en unos momentos para darte una atención personalizada. ¡Gracias por tu paciencia!";
            }
            else if (contacto.EtapaEmbudo == "Cerrado")
            {
                autoMsg = "*Mensaje Automático:* ¡Hola de nuevo! Es un gusto saludarte. Veo que ya hemos finalizado un proceso exitoso anteriormente. Un asesor se comunicará contigo en breve para asistirte con tus nuevos requerimientos inmobiliarios. ¡Gracias por elegirnos nuevamente!";
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
                var chatClient = new ChatClient("gpt-4o-mini", _config["OPENAI_API_KEY"]);
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
                newHistory.AddRange(history.Skip(7));
                
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
