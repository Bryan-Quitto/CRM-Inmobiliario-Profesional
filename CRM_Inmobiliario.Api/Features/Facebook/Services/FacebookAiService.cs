using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

/// <summary>
/// Orquesta el flujo de IA para un mensaje de Facebook Messenger:
/// contexto → LLM → respuesta → persistencia.
/// Sin tools de función — Facebook Messenger solo requiere respuestas de texto por ahora.
/// </summary>
public sealed class FacebookAiService
{
    private readonly IDbContextFactory<CrmDbContext> _dbFactory;
    private readonly IFacebookMessageSender _messageSender;
    private readonly LLMProviderFactory _providerFactory;
    private readonly ILogger<FacebookAiService> _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public FacebookAiService(
        IDbContextFactory<CrmDbContext> dbFactory,
        IFacebookMessageSender messageSender,
        LLMProviderFactory providerFactory,
        ILogger<FacebookAiService> logger,
        IHttpClientFactory httpClientFactory)
    {
        _dbFactory = dbFactory;
        _messageSender = messageSender;
        _providerFactory = providerFactory;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public async Task ProcessMessageAsync(string senderId, string text, string pageId, CancellationToken ct = default)
    {
        try
        {
            await using var dbContextCheck = await _dbFactory.CreateDbContextAsync(ct);
            var agente = await dbContextCheck.Agents.FirstOrDefaultAsync(a => a.FacebookPageId == pageId, ct);
            if (agente is null)
            {
                _logger.LogWarning("No hay agente configurado para la página de Facebook {PageId}.", pageId);
                return;
            }

            var builder = new FacebookContextBuilder(_dbFactory, _logger, _httpClientFactory);
            var contacto = await builder.GetOrCreateContactAsync(agente, senderId, ct);

            if (!agente.IsFacebookAiEnabled)
            {
                _logger.LogInformation("Facebook AI desactivado para el agente {AgentId}. Ignorando PSID {SenderId}.", agente.Id, senderId);
                if (contacto != null)
                {
                    await builder.LogMessageAsync(agente.Id, contacto.Id, senderId, "user", text, ct);
                }
                return;
            }

            var ctx = await builder.PrepareAsync(agente, contacto, senderId, pageId, ct);
            if (ctx is null) return;

            // Si el bot está desactivado para este contacto, no responder
            if (ctx.ShouldSilence)
            {
                _logger.LogInformation("Bot inactivo para PSID {SenderId}. Mensaje ignorado.", senderId);
                return;
            }

            _logger.LogInformation("\n=== [Facebook AI] Mensaje de Usuario ===\nAgentId: {AgentId}\nPSID: {SenderId}\nMensaje: {Text}\n========================================", 
                ctx.Agente.Id, senderId, text);

            await builder.LogMessageAsync(ctx.Agente.Id, ctx.Contacto?.Id, senderId, "user", text, ct);

            var history = ctx.History;
            history.Add(("user", text));

            // Seleccionar proveedor LLM usando la misma lógica BYOK que WhatsApp
            var rawProvider = ctx.Agente.ActiveLLMProvider ?? "OpenAI";
            var apiKey = !string.IsNullOrEmpty(ctx.Agente.AiApiKey)
                ? ctx.Agente.AiApiKey
                : (rawProvider == "Gemini"
                    ? Environment.GetEnvironmentVariable("GEMINI_API_KEY")
                    : Environment.GetEnvironmentVariable("OPENAI_API_KEY")) ?? string.Empty;

            // Detección dinámica del proveedor por prefijo de clave
            var providerName = rawProvider;
            if (apiKey.StartsWith("AIza", StringComparison.OrdinalIgnoreCase) || apiKey.StartsWith("AQ.", StringComparison.OrdinalIgnoreCase))
                providerName = "Gemini";
            else if (apiKey.StartsWith("sk-", StringComparison.OrdinalIgnoreCase))
                providerName = "OpenAI";

            var provider = _providerFactory.GetProvider(providerName, apiKey);

            var aiMessages = BuildAiMessages(ctx.Agente.Nombre, ctx.Agente.Apellido, history);
            var noTools = new List<AiToolDefinition>();

            var responseBuilder = new System.Text.StringBuilder();
            
            // Variables para tracking de tokens
            int? streamTotalTokens = null;
            int? streamInputTokens = null;
            int? streamOutputTokens = null;

            await foreach (var update in provider.StreamChatAsync(aiMessages, noTools, null, 500, cancellationToken: ct))
            {
                if (!string.IsNullOrEmpty(update.TextUpdate))
                    responseBuilder.Append(update.TextUpdate);
                    
                if (update.TotalTokens.HasValue)
                {
                    streamTotalTokens = update.TotalTokens;
                    streamInputTokens = update.InputTokens;
                    streamOutputTokens = update.OutputTokens;
                }
            }

            var response = responseBuilder.ToString();
            if (string.IsNullOrWhiteSpace(response))
            {
                _logger.LogWarning("Respuesta vacía del LLM para PSID {SenderId}.", senderId);
                return;
            }

            // Quitar formateo Markdown doble-asterisco (Messenger no lo soporta)
            response = Regex.Replace(response, @"\*+", "*");

            history.Add(("assistant", response));

            await builder.LogMessageAsync(ctx.Agente.Id, ctx.Contacto?.Id, senderId, "assistant", response, ct);
            await builder.SaveStateAsync(ctx.Conversation, history, ct);

            var pageToken = ctx.Agente.FacebookPageAccessToken ?? string.Empty;
            await _messageSender.SendTextMessageAsync(senderId, response, pageToken, ct);

            _logger.LogInformation("\n=== [Facebook AI] Respuesta de IA ===\nAgentId: {AgentId}\nTokens Totales: {TotalTokens} (Entrada: {InputTokens}, Salida: {OutputTokens})\nRespuesta: {Response}\n================================", 
                ctx.Agente.Id, streamTotalTokens ?? 0, streamInputTokens ?? 0, streamOutputTokens ?? 0, response);

            if (streamTotalTokens.HasValue)
            {
                try 
                {
                    await RecordTokenUsageAsync(ctx.Agente.Id, ctx.Contacto?.Id, streamTotalTokens.Value, streamInputTokens ?? 0, 0, streamOutputTokens ?? 0, providerName);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al registrar uso de tokens para Agente {AgentId}", ctx.Agente.Id);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en FacebookAiService para PSID {SenderId}", senderId);
            throw;
        }
    }

    private async Task RecordTokenUsageAsync(Guid agentId, Guid? contactoId, int totalTokens, int inputTokens, int cachedTokens, int outputTokens, string provider)
    {
        var today = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)).Date;

        decimal inputCostPer1K = provider == "Gemini" ? 0.000075m : 0.000150m;
        decimal outputCostPer1K = provider == "Gemini" ? 0.000300m : 0.000600m;
        decimal cachedCostPer1K = provider == "Gemini" ? 0.00001875m : 0m; 

        var inputCost = (inputTokens / 1000m) * inputCostPer1K;
        var outputCost = (outputTokens / 1000m) * outputCostPer1K;
        var cachedCost = (cachedTokens / 1000m) * cachedCostPer1K;

        var currentCost = inputCost + outputCost + cachedCost;

        await using var _dbContext = await _dbFactory.CreateDbContextAsync(CancellationToken.None);
        var usage = await _dbContext.AgentDailyTokenUsages
            .FirstOrDefaultAsync(u => u.AgentId == agentId && u.Date == today && u.Channel == "Facebook", CancellationToken.None);

        if (usage == null)
        {
            usage = new CRM_Inmobiliario.Api.Domain.Entities.AgentDailyTokenUsage
            {
                Id = Guid.NewGuid(),
                AgentId = agentId,
                Date = today,
                TokensUsed = totalTokens,
                InputTokens = inputTokens,
                CachedTokens = cachedTokens,
                OutputTokens = outputTokens,
                CostoUSD = currentCost,
                Channel = "Facebook"
            };
            _dbContext.AgentDailyTokenUsages.Add(usage);
        }
        else
        {
            usage.TokensUsed += totalTokens;
            usage.InputTokens += inputTokens;
            usage.CachedTokens += cachedTokens;
            usage.OutputTokens += outputTokens;
            usage.CostoUSD += currentCost;
        }

        if (contactoId.HasValue)
        {
            var contactUsage = await _dbContext.ContactDailyTokenUsages
                .FirstOrDefaultAsync(u => u.ContactoId == contactoId.Value && u.Date == today && u.Channel == "Facebook", CancellationToken.None);

            if (contactUsage == null)
            {
                contactUsage = new CRM_Inmobiliario.Api.Domain.Entities.ContactDailyTokenUsage
                {
                    Id = Guid.NewGuid(),
                    ContactoId = contactoId.Value,
                    Date = today,
                    TokensUsed = totalTokens,
                    InputTokens = inputTokens,
                    CachedTokens = cachedTokens,
                    OutputTokens = outputTokens,
                    CostoUSD = currentCost,
                    AhorroUSD = 0m,
                    Channel = "Facebook"
                };
                _dbContext.ContactDailyTokenUsages.Add(contactUsage);
            }
            else
            {
                contactUsage.TokensUsed += totalTokens;
                contactUsage.InputTokens += inputTokens;
                contactUsage.CachedTokens += cachedTokens;
                contactUsage.OutputTokens += outputTokens;
                contactUsage.CostoUSD += currentCost;
            }
        }

        await _dbContext.SaveChangesAsync(CancellationToken.None);
    }

    private static List<AiMessage> BuildAiMessages(
        string nombre, string apellido,
        List<(string Role, string Content)> history)
    {
        var agentName = $"{nombre} {apellido}".Trim();
        var systemPrompt = $"Eres el asistente virtual de {agentName}, especializado en bienes raíces. " +
            "Responde de manera profesional, amable y concisa en español. " +
            "Tu objetivo es ayudar al cliente con consultas de propiedades y agendar citas con el agente.";

        var messages = new List<AiMessage>
        {
            new() { Role = "system", Content = systemPrompt }
        };

        // Incluir las últimas 10 interacciones para evitar context overflow
        foreach (var (role, content) in history.TakeLast(10))
        {
            messages.Add(new() { Role = role, Content = content });
        }

        return messages;
    }
}
