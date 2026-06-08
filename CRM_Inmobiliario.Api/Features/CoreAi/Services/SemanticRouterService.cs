using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Services;

public class SemanticRouterService : ISemanticRouterService
{
    private readonly ILogger<SemanticRouterService> _logger;
    private readonly LLMProviderFactory _providerFactory;

    public SemanticRouterService(ILogger<SemanticRouterService> logger, LLMProviderFactory providerFactory)
    {
        _logger = logger;
        _providerFactory = providerFactory;
    }

    public async Task<ChatIntent> DetermineIntentAsync(IReadOnlyList<ChatMessage> history, string providerName, string apiKeyToUse, CancellationToken cancellationToken = default)
    {
        if (history == null || history.Count <= 1)
        {
            return ChatIntent.CONTINUACION;
        }

        var routerMessages = new List<AiMessage>
        {
            new AiMessage 
            { 
                Role = "system", 
                Content = "Evalúa la intención de la última interacción del usuario. Responde con la propiedad 'intent'. Valores posibles: 'NUEVA_BUSQUEDA' (si pide buscar propiedades diferentes, cambia de ciudad/sector, o quiere empezar de cero), 'CAMBIO_TEMA' (si cambia de tema por completo) o 'CONTINUACION' (si es una respuesta a una pregunta, aporta más detalles a la búsqueda actual, o pregunta por una de las propiedades enviadas). No uses ningún otro formato ni expliques nada." 
            }
        };

        var lastMessages = history.Where(m => m.Role == ChatRole.User || m.Role == ChatRole.Assistant)
                                    .Where(m => !m.Contents.Any(c => c is FunctionCallContent))
                                    .TakeLast(3).ToList();
        
        foreach(var m in lastMessages)
        {
            var roleStr = m.Role == ChatRole.User ? "user" : "assistant";
            var content = m.Text ?? "";
            routerMessages.Add(new AiMessage { Role = roleStr, Content = content });
        }
        
        string modelToUse = providerName == "OpenAI" ? "gpt-4o-mini" : "gemini-2.5-flash-lite";
        var routerProvider = _providerFactory.GetProvider(providerName, apiKeyToUse, modelToUse);
        
        var routerResultWrapper = await routerProvider.GetStructuredResponseAsync<SemanticRouterResponse>(routerMessages, cancellationToken);
        var routerResult = routerResultWrapper?.Intent ?? ChatIntent.CONTINUACION;

        if (routerResult == ChatIntent.NUEVA_BUSQUEDA || routerResult == ChatIntent.CAMBIO_TEMA)
        {
            _logger.LogInformation("Semantic Router: {Intent} detectada.", routerResult.ToString());
        }
        else
        {
            _logger.LogInformation("Semantic Router: CONTINUACION detectada.");
        }

        return routerResult;
    }
}


