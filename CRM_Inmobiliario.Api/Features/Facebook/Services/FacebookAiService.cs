using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using System.Text.RegularExpressions;
using CRM_Inmobiliario.Api.Domain.Enums;

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
    private readonly IFacebookConsentService _consentService;

    public FacebookAiService(
        IDbContextFactory<CrmDbContext> dbFactory,
        IFacebookMessageSender messageSender,
        LLMProviderFactory providerFactory,
        ILogger<FacebookAiService> logger,
        IHttpClientFactory httpClientFactory,
        Microsoft.Extensions.DependencyInjection.IServiceScopeFactory scopeFactory,
        IFacebookConsentService consentService)
    {
        _dbFactory = dbFactory;
        _messageSender = messageSender;
        _providerFactory = providerFactory;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
        _scopeFactory = scopeFactory;
        _consentService = consentService;
    }

    public async Task ProcessMessageAsync(string senderId, string text, string pageId, string? codigoCorto = null, CancellationToken ct = default)
    {
        try
        {
            await using var dbContextCheck = await _dbFactory.CreateDbContextAsync(ct);
            var agente = await dbContextCheck.Agents.Include(a => a.Agencia).FirstOrDefaultAsync(a => a.FacebookPageId == pageId, ct);
            if (agente is null)
            {

                return;
            }

            var builder = new FacebookContextBuilder(_dbFactory, _logger, _httpClientFactory);
            var contacto = await builder.GetOrCreateContactAsync(agente, senderId, ct);
            
            if (contacto != null)
            {
                var isArchived = await dbContextCheck.AgentArchivedContacts.AnyAsync(a => a.AgentId == agente.Id && a.ContactoId == contacto.Id, ct);
                if (isArchived)
                {

                    return;
                }
            }

            if (!agente.IsFacebookAiEnabled)
            {

                if (contacto != null)
                {
                    await builder.LogMessageAsync(agente.Id, contacto.Id, senderId, "user", text, ct);
                }
                return;
            }

            if (contacto != null && agente != null)
            {
                var consentResult = await _consentService.HandleConsentAsync(contacto, senderId, text, agente.FacebookPageAccessToken, $"{agente.Nombre} {agente.Apellido}", ct);
                if (consentResult == ConsentResult.RequestSent || 
                    consentResult == ConsentResult.DeniedResponse || 
                    consentResult == ConsentResult.StillPending || 
                    consentResult == ConsentResult.Denied ||
                    consentResult == ConsentResult.JustGranted)
                {
                    return; // Abortar flujo, el ConsentService ya se encargó de responder
                }
            }

            var ctx = await builder.PrepareAsync(agente!, contacto, senderId, pageId, ct);
            if (ctx is null) return;

            var history = ctx.History;

            if (!string.IsNullOrEmpty(codigoCorto))
            {
                var propertyContext = await dbContextCheck.Properties.FirstOrDefaultAsync(p => p.CodigoCorto == codigoCorto, ct);
                if (propertyContext != null)
                {
                    history.Add(("system", $"[CONTEXTO AUTOMÁTICO] El cliente acaba de hacer clic en un anuncio de la propiedad: {propertyContext.Titulo} (Código: {propertyContext.CodigoCorto}, Precio: {propertyContext.Precio}). Asume que su consulta inicial es sobre esta propiedad."));
                }
            }

            // Si el bot está desactivado para este contacto, no responder
            if (ctx.ShouldSilence)
            {

                return;
            }



            await builder.LogMessageAsync(ctx.Agente.Id, ctx.Contacto?.Id, senderId, "user", text, ct);

            if (!string.IsNullOrWhiteSpace(text))
            {
                history.Add(("user", text));
            }

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

            await builder.SaveStateAsync(ctx.Conversation, history, ct);

            var pageToken = ctx.Agente.FacebookPageAccessToken ?? string.Empty;
            await _messageSender.SendTextMessageAsync(senderId, response, pageToken, isAiResponse: true, contactoId: ctx.Contacto?.Id, agenteId: ctx.Agente.Id, cancellationToken: ct);



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
        catch (Exception)
        {

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
            "REGLA CRÍTICA POST-ESCALAMIENTO: Después de invocar 'SolicitarAsistenciaHumana', DEBES cesar completamente de responder. NO generes ningún mensaje al cliente. El sistema enviará una notificación automática. Cualquier mensaje tuyo causaría duplicados y confusión.\n\n" +
            "REGLA DE FOTOS Y GALERÍA (CRÍTICA): Si el cliente solicita ver fotos de la propiedad en general, fotos de la sala, habitaciones, etc., DEBES invocar la herramienta 'EnviarFotosSeccionPropiedad' pasando el nombre de la sección (ej. 'General', 'Sala', 'Dormitorios'). Si pide 'todas', llama con enviarTodas=true.\n\n" +
            "PLANTILLAS DE RESPUESTA (ELIGE SEGÚN EL TIPO DE PROPIEDAD):\n" +
            "REGLA GENERAL PARA TODAS LAS PLANTILLAS:\n" +
            "1. TITULO EN MAYÚSCULAS (Escribe el texto plano, sin asteriscos ni markdown).\n" +
            "2. ¡ESTÁ ESTRICTAMENTE PROHIBIDO INCLUIR LA DIRECCIÓN EXACTA O UBICACIÓN GPS EN EL MENSAJE! Solo debes mencionar Sector y Ciudad.\n\n" +
            "-> SI ES CASA, DEPARTAMENTO, SUITE U HOTEL (Residencial):\n" +
            "💰 Precio: $Valor\n\n" +
            "📍 Zona: Sector, Ciudad\n\n" +
            "✨ Distribución:\n" +
            "🛏️ Habitaciones | 🚿 Baños (incluye medios baños) | 🚗 Parqueos | 📏 Área\n\n" +
            "📅 Antigüedad: X años\n" +
            "📝 Nota: _[Si el cliente preguntó por algo específico como mascotas o alícuota, saca ese dato de la Descripción y ponlo aquí en cursiva. Si no, omítelo]_\n" +
            "🔗 [Ver más detalles aquí](UrlRemax)\n\n" +
            "-> SI ES TERRENO:\n" +
            "💰 Precio: $Valor\n\n" +
            "📍 Zona: Sector, Ciudad\n\n" +
            "✨ Características:\n" +
            "📏 Área Total: X m²\n\n" +
            "📝 Nota: _[Si el cliente preguntó algo específico, ponlo aquí. Si no, omítelo]_\n" +
            "🔗 [Ver más detalles aquí](UrlRemax)\n\n" +
            "-> SI ES LOCAL COMERCIAL, OFICINA, BODEGA O GALPÓN (Comercial):\n" +
            "💰 Precio: $Valor\n\n" +
            "📍 Zona: Sector, Ciudad\n\n" +
            "✨ Distribución:\n" +
            "🚿 Baños | 🚗 Parqueos (si aplica) | 📏 Área\n\n" +
            "📅 Antigüedad: X años\n" +
            "📝 Nota: _[Si el cliente preguntó algo específico, ponlo aquí. Si no, omítelo]_\n" +
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
