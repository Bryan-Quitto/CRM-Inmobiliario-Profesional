using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using System.Collections.Generic;
using System.Linq;
using System;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Extensions;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public sealed class WhatsAppConversationManager : IWhatsAppConversationManager
{
    private readonly CrmDbContext _context;
    private readonly ILogger<WhatsAppConversationManager> _logger;
    private readonly IWhatsAppPromptBuilder _promptBuilder;
    private readonly IWhatsAppContactProcessor _contactProcessor;
    private readonly IWhatsAppBotRulesProcessor _rulesProcessor;
    private readonly IWhatsAppMemoryProcessor _memoryProcessor;
    private readonly IWhatsAppTokenUsageProcessor _tokenProcessor;

    public WhatsAppConversationManager(
        CrmDbContext context, 
        ILogger<WhatsAppConversationManager> logger,
        IWhatsAppPromptBuilder promptBuilder,
        IWhatsAppContactProcessor contactProcessor,
        IWhatsAppBotRulesProcessor rulesProcessor,
        IWhatsAppMemoryProcessor memoryProcessor,
        IWhatsAppTokenUsageProcessor tokenProcessor)
    {
        _context = context;
        _logger = logger;
        _promptBuilder = promptBuilder;
        _contactProcessor = contactProcessor;
        _rulesProcessor = rulesProcessor;
        _memoryProcessor = memoryProcessor;
        _tokenProcessor = tokenProcessor;
    }

    public async Task<Contacto?> GetOrCreateContactAsync(string phone, string phoneNumberId, bool autoCreate, CancellationToken cancellationToken = default)
    {
        return await _contactProcessor.GetOrCreateContactAsync(phone, phoneNumberId, autoCreate, cancellationToken);
    }

    public async Task<WhatsAppContext> PrepareContextAsync(Contacto? contacto, string phone, string messageText, string phoneNumberId, CancellationToken cancellationToken = default)
    {
        string? autoMsg = await _rulesProcessor.ApplyHandoffRulesAsync(contacto, cancellationToken);

        var conversation = await _context.WhatsappConversations
            .FirstOrDefaultAsync(c => c.ContactoId == contacto!.Id, cancellationToken);
        
        List<ChatMessage> history;
        bool isFirstMessage = conversation == null;
        bool contactExists = contacto != null && contacto.Nombre != "Cliente WA";

        if (isFirstMessage)
        {
            history = new List<ChatMessage> { new ChatMessage(ChatRole.System, _promptBuilder.GetSystemPrompt(contactExists, contacto?.Nombre, isFirstMessage, contacto?.Agente?.Agencia?.ContextoCorporativoIA, contacto?.Agente?.PromptPersonalIA)) };
            conversation = new WhatsappConversation
            {
                Id = Guid.NewGuid(),
                ContactoId = contacto!.Id,
                Telefono = phone.NormalizePhoneE164() ?? phone,
                HistorialJson = _promptBuilder.SerializeHistory(history),
                UltimaActualizacion = DateTimeOffset.UtcNow
            };
            _context.WhatsappConversations.Add(conversation);
        }
        else
        {
            history = _promptBuilder.DeserializeHistory(conversation!.HistorialJson ?? "[]", contactExists, contacto?.Nombre, isFirstMessage, contacto?.Agente?.Agencia?.ContextoCorporativoIA, contacto?.Agente?.PromptPersonalIA);
            
            if (history.Count > 0 && history[0].Role == ChatRole.System)
            {
                history[0] = new ChatMessage(ChatRole.System, _promptBuilder.GetSystemPrompt(contactExists, contacto?.Nombre, isFirstMessage, contacto?.Agente?.Agencia?.ContextoCorporativoIA, contacto?.Agente?.PromptPersonalIA));
            }
        }

        history.Add(new ChatMessage(ChatRole.User, messageText));
        history = await _memoryProcessor.CompressMemoryAsync(history, contacto, contactExists, isFirstMessage, default);

        return new WhatsAppContext(contacto, conversation, history, autoMsg, isFirstMessage);
    }

    public async Task SaveStateAsync(Guid contactoId, List<ChatMessage> history, CancellationToken cancellationToken = default)
    {
        var conversation = await _context.WhatsappConversations
            .FirstOrDefaultAsync(c => c.ContactoId == contactoId, cancellationToken);

        if (conversation != null)
        {
            conversation.HistorialJson = _promptBuilder.SerializeHistory(history);
            conversation.UltimaActualizacion = DateTimeOffset.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task LogMessageAsync(Guid contactoId, string phone, string role, string content, CancellationToken cancellationToken = default)
    {
        _context.WhatsappMessages.Add(new WhatsappMessage 
        { 
            Id = Guid.NewGuid(),
            ContactoId = contactoId,
            Telefono = phone, 
            Rol = role, 
            OrigenMensaje = role == "user" ? "Cliente" : "IA",
            Contenido = content, 
            Fecha = DateTimeOffset.UtcNow 
        });
        await _context.SaveChangesAsync(cancellationToken);

        var contacto = await _context.Contactos.FindAsync(new object[] { contactoId }, cancellationToken);
        if (contacto != null)
        {
            await _context.UpsertAgentContactActivityAsync(contacto.AgenteId, contacto.Id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), cancellationToken);
        }
    }

    public async Task RecordTokenUsageAsync(Guid contactoId, int totalTokens, int inputTokens, int cachedTokens, int outputTokens, string provider = "OpenAI", CancellationToken cancellationToken = default)
    {
        await _tokenProcessor.RecordTokenUsageAsync(contactoId, totalTokens, inputTokens, cachedTokens, outputTokens, provider, cancellationToken);
    }

    public void ApplyNuevaBusqueda(List<ChatMessage> history)
    {
        _memoryProcessor.ApplyNuevaBusqueda(history);
    }
}
