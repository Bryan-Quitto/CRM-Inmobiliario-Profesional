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

    public WhatsAppConversationManager(
        CrmDbContext context, 
        ILogger<WhatsAppConversationManager> logger,
        IWhatsAppPromptBuilder promptBuilder)
    {
        _context = context;
        _logger = logger;
        _promptBuilder = promptBuilder;
    }

    public async Task<WhatsAppContext> PrepareContextAsync(string phone, string messageText)
    {
        // 1. Búsqueda inteligente del Lead
        string searchPhone = phone.StartsWith("+") ? phone : "+" + phone;
        var lead = await _context.Leads.AsNoTracking()
            .FirstOrDefaultAsync(l => l.Telefono == phone || l.Telefono == searchPhone);
        
        // 2. Filtrado por Etapa
        string? autoMsg = null;
        if (lead != null)
        {
            if (lead.EtapaEmbudo == "En Negociación")
            {
                autoMsg = "*Mensaje Automático:* Hola, hemos recibido tu mensaje. Como te encuentras en proceso de negociación, un asesor humano se contactará contigo en unos momentos para darte una atención personalizada. ¡Gracias por tu paciencia!";
            }
            else if (lead.EtapaEmbudo == "Cerrado")
            {
                autoMsg = "*Mensaje Automático:* ¡Hola de nuevo! Es un gusto saludarte. Veo que ya hemos finalizado un proceso exitoso anteriormente. Un asesor se comunicará contigo en breve para asistirte con tus nuevos requerimientos inmobiliarios. ¡Gracias por elegirnos nuevamente!";
            }
        }

        // 3. Obtener o crear conversación
        var conversation = await _context.WhatsappConversations
            .FirstOrDefaultAsync(c => c.Telefono == phone);
        
        List<ChatMessage> history;
        bool leadExists = lead != null;

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

        // 4. Añadir mensaje del usuario a la historia
        history.Add(new UserChatMessage(messageText));

        // 5. Control de Costos (Ventana deslizante)
        if (history.Count > 12) 
        {
            var systemMessage = history[0];
            history = history.Skip(history.Count - 10).ToList();
            history.Insert(0, systemMessage);
        }

        return new WhatsAppContext(lead, conversation, history, autoMsg);
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
