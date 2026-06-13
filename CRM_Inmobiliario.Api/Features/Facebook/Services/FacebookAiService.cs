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
    private readonly Microsoft.Extensions.DependencyInjection.IServiceScopeFactory _scopeFactory;

    public FacebookAiService(
        IDbContextFactory<CrmDbContext> dbFactory,
        IFacebookMessageSender messageSender,
        LLMProviderFactory providerFactory,
        ILogger<FacebookAiService> logger,
        IHttpClientFactory httpClientFactory,
        Microsoft.Extensions.DependencyInjection.IServiceScopeFactory scopeFactory)
    {
        _dbFactory = dbFactory;
        _messageSender = messageSender;
        _providerFactory = providerFactory;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _scopeFactory = scopeFactory;
    }

    public async Task ProcessMessageAsync(string senderId, string text, string pageId, CancellationToken ct = default)
    {
        try
        {
            await using var dbContextCheck = await _dbFactory.CreateDbContextAsync(ct);
            var agente = await dbContextCheck.Agents.Include(a => a.Agencia).FirstOrDefaultAsync(a => a.FacebookPageId == pageId, ct);
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

            var tools = CRM_Inmobiliario.Api.Features.WhatsApp.Services.Prompts.AiToolDefinitions.GetTools("Facebook");
            var aiMessages = BuildAiMessages(ctx.Agente.Nombre, ctx.Agente.Apellido, history, ctx.Agente.Agencia?.ContextoCorporativoIA, ctx.Agente.PromptPersonalIA);

            var (response, streamTotalTokens, streamInputTokens, streamOutputTokens) = await FacebookAiLoopHelper.RunLoopAsync(
                provider,
                history,
                aiMessages,
                tools,
                senderId,
                pageId,
                ctx.Contacto?.Id,
                text,
                _scopeFactory,
                _logger,
                ct);

            if (string.IsNullOrWhiteSpace(response))
            {
                _logger.LogWarning("Respuesta vacía del LLM para PSID {SenderId}.", senderId);
                return;
            }

            if (history.Count == 1)
            {
                string agentName = $"{ctx.Agente.Nombre} {ctx.Agente.Apellido}".Trim();
                if (string.IsNullOrEmpty(agentName)) agentName = "nuestro equipo";
                string header = $"¡Hola! Soy el asistente virtual de {agentName} 🤖.\n\n";
                string footer = $"\n\n💡 _Si prefieres atención personalizada, solo dímelo y {agentName} se conectará contigo._";
                
                response = header + response + footer;
            }

            // Quitar formateo Markdown doble-asterisco (Messenger no lo soporta)
            response = Regex.Replace(response, @"\*+", "*");

            history.Add(("assistant", response));

            await builder.LogMessageAsync(ctx.Agente.Id, ctx.Contacto?.Id, senderId, "assistant", response, ct);
            await builder.SaveStateAsync(ctx.Conversation, history, ct);

            var pageToken = ctx.Agente.FacebookPageAccessToken ?? string.Empty;
            await _messageSender.SendTextMessageAsync(senderId, response, pageToken, ct);

            _logger.LogInformation("\n=== [Facebook AI] Respuesta de IA ===\nAgentId: {AgentId}\nTokens Totales: {TotalTokens} (Entrada: {InputTokens}, Salida: {OutputTokens})\nRespuesta: {Response}\n================================", 
                ctx.Agente.Id, streamTotalTokens, streamInputTokens, streamOutputTokens, response);

            if (streamTotalTokens > 0)
            {
                try 
                {
                    await RecordTokenUsageAsync(ctx.Agente.Id, ctx.Contacto?.Id, streamTotalTokens, streamInputTokens, 0, streamOutputTokens, providerName);
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
        List<(string Role, string Content)> history,
        string? corporateContext, string? personalContext)
    {
        var agentName = $"{nombre} {apellido}".Trim();
        var systemPrompt = $"Eres el asistente virtual de {agentName}, especializado en bienes raíces. " +
            "Responde de manera profesional, amable y concisa en español. " +
            $"Tu objetivo es ayudar al cliente con consultas de propiedades y agendar citas con {agentName}.\n\n" +
            "REGLA DE BÚSQUEDA (CRÍTICA): Si el cliente menciona propiedades, oficinas, ventas o alquileres, DEBES invocar la herramienta 'BuscarPropiedades' INMEDIATAMENTE para encontrar la propiedad antes de intentar responder detalles específicos (como alícuotas, mascotas, etc). NUNCA uses 'ConsultarBaseConocimiento' para buscar detalles de una propiedad.\n\n" +
            "REGLA DE NEGOCIACIÓN Y CIERRE (CRÍTICA): Asume SIEMPRE que todas las propiedades son NEGOCIABLES. " +
            "Si el cliente pregunta si el precio es negociable, si hay descuento o rebaja, DEBES responder exactamente esto y NADA MÁS: " +
            $"'Sí, el precio es negociable. Para brindarte una mejor ayuda, {agentName} seguirá con tu caso en unos momentos.' " +
            "E INMEDIATAMENTE después, ejecuta la función/herramienta 'SolicitarAsistenciaHumana'. NO agregues ninguna otra frase tuya.\n\n" +
            "PLANTILLAS DE RESPUESTA (OBLIGATORIAS PARA TODAS LAS PROPIEDADES):\n" +
            "Escribe el nombre de la propiedad EN MAYÚSCULAS y sin formato markdown.\n" +
            "💰 Precio: $Valor\n\n" +
            "📍 Zona: Sector, Ciudad\n" +
            "🗺️ Dirección Exacta: Calle, Avenida, etc. (REGLA: Si la base de datos no te da una calle o dirección exacta pública, OMITE esta línea completa. NUNCA inventes direcciones ni repitas el sector aquí).\n\n" +
            "✨ Distribución:\n" +
            "🛏️ Habitaciones | 🚿 Baños (incluir medios baños si aplica) | 🚗 Parqueos | 📏 Área\n\n" +
            "📅 Antigüedad: X años\n" +
            "📝 Nota: _[Si el cliente preguntó por algo específico como mascotas, alícuota o insonorización, saca ese dato de la Descripción de la propiedad y ponlo aquí en cursiva. Si no preguntó nada, omite esta línea completa]_\n" +
            "🔗 [Ver más detalles aquí](UrlRemax)";

        if (!string.IsNullOrWhiteSpace(corporateContext))
        {
            systemPrompt += "\n\n--- CONTEXTO CORPORATIVO (REGLAS DE LA AGENCIA) ---\n" + corporateContext;
        }
        if (!string.IsNullOrWhiteSpace(personalContext))
        {
            systemPrompt += "\n\n--- CONTEXTO DEL AGENTE (TU PERSONALIDAD Y REGLAS) ---\n" + personalContext;
        }

        if (history.Count == 1)
        {
            systemPrompt += "\n\nREGLA CRÍTICA: NO debes incluir ningún saludo inicial (como 'Hola', 'Buenos días', etc.) en esta respuesta, ya que el sistema inyecta un saludo automáticamente por ti.";
        }

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
