using System;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.AI;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using System.Collections.Generic;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Services;

public class AgentTitleGeneratorService
{
    private readonly ILogger<AgentTitleGeneratorService> _logger;
    private readonly CrmDbContext _dbContext;
    private readonly LLMProviderFactory _providerFactory;

    public AgentTitleGeneratorService(
        ILogger<AgentTitleGeneratorService> logger,
        CrmDbContext dbContext,
        LLMProviderFactory providerFactory)
    {
        _logger = logger;
        _dbContext = dbContext;
        _providerFactory = providerFactory;
    }

    public async Task GenerateTitleAsync(Guid agentId, Guid conversationId, string firstMessage, CancellationToken cancellationToken = default)
    {
        try
        {
            var agent = await _dbContext.Agents.FirstOrDefaultAsync(a => a.Id == agentId, cancellationToken);
            if (agent == null) return;

            var providerName = agent.ActiveLLMProvider ?? "OpenAI";
            string apiKey = agent.AiApiKey ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY") ?? string.Empty;

            var provider = _providerFactory.GetProvider(providerName, apiKey);

            var messages = new List<AiMessage>
            {
                new AiMessage { Role = "system", Content = "Hazme un resumen de 3-4 palabras para este texto. Escribe SOLO el título, sin comillas ni puntos finales." },
                new AiMessage { Role = "user", Content = firstMessage }
            };

            var titleBuilder = new System.Text.StringBuilder();
            await foreach (var update in provider.StreamChatAsync(messages, new List<AiToolDefinition>(), null, 50, cancellationToken))
            {
                if (!string.IsNullOrEmpty(update.TextUpdate))
                {
                    titleBuilder.Append(update.TextUpdate);
                }
            }

            var titleResponse = titleBuilder.ToString();
            if (!string.IsNullOrWhiteSpace(titleResponse))
            {
                var conversation = await _dbContext.AgentConversations.FirstOrDefaultAsync(c => c.Id == conversationId, cancellationToken);
                if (conversation != null)
                {
                    conversation.Title = titleResponse.Trim();
                    await _dbContext.SaveChangesAsync(cancellationToken);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error al generar título para la conversación {ConversationId}", conversationId);
        }
    }
}
