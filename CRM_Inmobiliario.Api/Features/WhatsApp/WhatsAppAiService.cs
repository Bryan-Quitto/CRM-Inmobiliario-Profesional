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
    private readonly CRM_Inmobiliario.Api.Features.CoreAi.Services.ISemanticRouterService _semanticRouterService;
    private readonly IWhatsAppMessageSender _messageSender;
    private readonly IWhatsAppConversationManager _conversationManager;
    private readonly IDbContextFactory<CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext> _dbContextFactory;
    private readonly CRM_Inmobiliario.Api.Features.WhatsApp.Services.LLMProviderFactory _providerFactory;
    private readonly string? _openAiApiKey;
    private readonly IWhatsAppLlmOrchestrator _llmOrchestrator;

    public WhatsAppAiService(
        ILogger<WhatsAppAiService> logger,
        CRM_Inmobiliario.Api.Features.CoreAi.Services.ISemanticRouterService semanticRouterService,
        IWhatsAppMessageSender messageSender,
        IWhatsAppConversationManager conversationManager,
        IDbContextFactory<CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext> dbContextFactory,
        CRM_Inmobiliario.Api.Features.WhatsApp.Services.LLMProviderFactory providerFactory,
        IWhatsAppLlmOrchestrator llmOrchestrator)
    {
        _logger = logger;
        _semanticRouterService = semanticRouterService;
        _messageSender = messageSender;
        _conversationManager = conversationManager;
        _dbContextFactory = dbContextFactory;
        _providerFactory = providerFactory;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
        _llmOrchestrator = llmOrchestrator;
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
                
                if (contacto != null)
                {
                    var isArchived = await dbContextCheck.AgentArchivedContacts.AnyAsync(a => a.AgentId == agente.Id && a.ContactoId == contacto.Id, cancellationToken);
                    if (isArchived)
                    {

                        return;
                    }
                }
            }

            if (agente != null && !agente.IsWhatsAppAiEnabled)
            {

                if (contacto != null)
                {
                    await _conversationManager.LogMessageAsync(contacto.Id, phone, "user", messageText, cancellationToken);
                }
                return;
            }



            var context = await _conversationManager.PrepareContextAsync(contacto, phone, messageText, phoneNumberId, cancellationToken);
            
            if (context.Contacto != null)
            {
                await _conversationManager.LogMessageAsync(context.Contacto.Id, phone, "user", messageText, cancellationToken);
            }

            if (context.AutoResponse != null)
            {
                if (!string.IsNullOrEmpty(context.AutoResponse))
                {

                    await _messageSender.SendWhatsAppMessageAsync(phone, context.AutoResponse, phoneNumberId, isAiResponse: true, contactoId: context.Contacto?.Id, cancellationToken: cancellationToken);
                }
                else
                {

                }
                return;
            }

            await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
            var tenantAgent = await dbContext.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == phoneNumberId, cancellationToken);
            string rawProviderName = tenantAgent?.ActiveLLMProvider ?? "OpenAI";
            string apiKeyToUse = !string.IsNullOrEmpty(tenantAgent?.AiApiKey) 
                ? tenantAgent.AiApiKey 
                : (rawProviderName == "Gemini" ? Environment.GetEnvironmentVariable("GEMINI_API_KEY") : _openAiApiKey) ?? "";
            
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

            var routerResult = await _semanticRouterService.DetermineIntentAsync(history, providerName, apiKeyToUse, cancellationToken);
            if (routerResult == CRM_Inmobiliario.Api.Features.CoreAi.Services.ChatIntent.NUEVA_BUSQUEDA || routerResult == CRM_Inmobiliario.Api.Features.CoreAi.Services.ChatIntent.CAMBIO_TEMA)
            {
                _conversationManager.ApplyNuevaBusqueda(history);
            }

            var orchestratorContext = new LlmOrchestratorContext(
                phone, phoneNumberId, messageText, audioBytes, mediaUrl,
                context.Contacto, tenantAgent, context.IsFirstMessage, history
            );

            string? finalResponse = await _llmOrchestrator.ProcessLlmInteractionAsync(
                orchestratorContext, providerName, provider, tools, cancellationToken);

            if (context.Contacto != null)
            {
                await _conversationManager.SaveStateAsync(context.Contacto.Id, history, cancellationToken);
            }

            if (!string.IsNullOrEmpty(finalResponse))
            {
                finalResponse = Regex.Replace(finalResponse, @"\*+", "*");
                await _messageSender.SendWhatsAppMessageAsync(phone, finalResponse, phoneNumberId, isAiResponse: true, contactoId: context.Contacto?.Id, cancellationToken: cancellationToken);
            }
        }
        catch (Polly.Timeout.TimeoutRejectedException)
        {

            throw;
        }
        catch (Exception)
        {

            throw;
        }
    }
}
