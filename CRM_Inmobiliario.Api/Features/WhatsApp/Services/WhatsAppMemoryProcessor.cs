using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using System.Collections.Generic;
using System.Linq;
using System;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppMemoryProcessor
{
    Task<List<ChatMessage>> CompressMemoryAsync(List<ChatMessage> history, Contacto? contacto, bool contactExists, bool isFirstMessage, CancellationToken cancellationToken = default);
    void ApplyNuevaBusqueda(List<ChatMessage> history);
}

public sealed class WhatsAppMemoryProcessor : IWhatsAppMemoryProcessor
{
    private readonly ILogger<WhatsAppMemoryProcessor> _logger;
    private readonly IWhatsAppPromptBuilder _promptBuilder;
    private readonly Microsoft.Extensions.Configuration.IConfiguration _config;
    private readonly LLMProviderFactory _providerFactory;

    public WhatsAppMemoryProcessor(
        ILogger<WhatsAppMemoryProcessor> logger,
        IWhatsAppPromptBuilder promptBuilder,
        Microsoft.Extensions.Configuration.IConfiguration config,
        LLMProviderFactory providerFactory)
    {
        _logger = logger;
        _promptBuilder = promptBuilder;
        _config = config;
        _providerFactory = providerFactory;
    }

    public async Task<List<ChatMessage>> CompressMemoryAsync(List<ChatMessage> history, Contacto? contacto, bool contactExists, bool isFirstMessage, CancellationToken cancellationToken = default)
    {
        if (history.Count <= 12) return history;

        var systemMessage = history.FirstOrDefault(m => m.Role == ChatRole.System) 
                            ?? new ChatMessage(ChatRole.System, _promptBuilder.GetSystemPrompt(contactExists, contacto?.Nombre, isFirstMessage, contacto?.Agente?.Agencia?.ContextoCorporativoIA, contacto?.Agente?.PromptPersonalIA));
        
        var transactionalMessages = history.Where(m => m.Role != ChatRole.System).ToList();
        var messagesToCompress = transactionalMessages.Take(6).ToList();
        
        try 
        {
            var providerName = contacto?.Agente?.ActiveLLMProvider ?? "OpenAI";
            var apiKey = contacto?.Agente?.AiApiKey ?? (providerName == "Gemini" ? _config["GEMINI_API_KEY"] : _config["OPENAI_API_KEY"]) ?? "";
            var provider = _providerFactory.GetProvider(providerName, apiKey);
            var promptStr = "Resume esta interacción para la memoria del sistema. Enfócate SOLO en DATOS DUROS del cliente: " +
                            "Qué busca, Presupuesto, Ubicaciones, y qué propiedades le gustaron o rechazó. Omite saludos. Formato de viñetas muy denso.";
            
            var plainTextHistory = string.Join("\n", messagesToCompress.Select(m => {
                var role = m.Role == ChatRole.User ? "Cliente" : m.Role == ChatRole.System ? "Memoria" : "IA";
                var text = string.IsNullOrEmpty(m.Text) ? "[Uso de Herramienta]" : m.Text;
                return $"{role}: {text}";
            }));

            var compressionMessages = new List<AiMessage> { 
                new AiMessage { Role = "system", Content = promptStr },
                new AiMessage { Role = "user", Content = plainTextHistory }
            };
            
            var updates = provider.StreamChatAsync(compressionMessages, new List<AiToolDefinition>(), apiKey, cancellationToken: cancellationToken);
            var resumen = "";
            await foreach (var chunk in updates)
            {
                if (!string.IsNullOrEmpty(chunk.TextUpdate)) resumen += chunk.TextUpdate;
            }
            
            var newHistory = new List<ChatMessage> { systemMessage };
            newHistory.Add(new ChatMessage(ChatRole.System, $"[MEMORIA HISTÓRICA DEL CLIENTE]:\n{resumen}"));
            
            var tail = transactionalMessages.Skip(6).ToList();
            while (tail.Count > 0 && tail[0].Role == ChatRole.Tool)
            {
                tail.RemoveAt(0);
            }
            newHistory.AddRange(tail);
            

            return newHistory;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fallo en compresión semántica. Usando truncado clásico.");
            return new[] { systemMessage }.Concat(transactionalMessages.TakeLast(10)).ToList();
        }
    }

    public void ApplyNuevaBusqueda(List<ChatMessage> history)
    {
        if (history.Count <= 1) return;

        var systemMessage = history.FirstOrDefault(m => m.Role == ChatRole.System);
        if (systemMessage == null) return;
        
        var transactionalMessages = history.Where(m => m.Role != ChatRole.System).ToList();
        
        var slidingWindow = transactionalMessages.TakeLast(6).ToList();
        
        slidingWindow.RemoveAll(m => 
            m.Role == ChatRole.Tool || 
            (m.Role == ChatRole.Assistant && m.Contents.Any(c => c is FunctionCallContent)));
            
        history.Clear();
        history.Add(systemMessage);
        history.AddRange(slidingWindow);
    }
}
