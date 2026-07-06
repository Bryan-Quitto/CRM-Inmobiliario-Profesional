using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using System.Text.Json;
using System.Text;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Domain.Enums;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pgvector.EntityFrameworkCore;
using OpenAI.Embeddings;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Tools;

public sealed class ConsultarBaseConocimientoHandler : BaseCoreAiToolHandler
{
    private readonly CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService _embeddingService;

    public ConsultarBaseConocimientoHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<ConsultarBaseConocimientoHandler> logger, CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService embeddingService) 
        : base(dbContextFactory, logger) 
    { 
        _embeddingService = embeddingService;
    }

    public override string ToolName => "ConsultarBaseConocimiento";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var _context = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        string queryStr = ExtractSafeString(args.RootElement, "query", 500, string.Empty);



        if (string.IsNullOrEmpty(queryStr))
        {
            return "No se especificó la pregunta para consultar en la base de datos corporativa.";
        }

        Guid? currentAgencyId = null;
        string? provider = null;
        string? apiKey = null;

        var agent = await ResolveIdentityAsync(context, cancellationToken);
        if (agent != null)
        {
            currentAgencyId = agent.AgenciaId;
            provider = agent.ActiveLLMProvider;
            apiKey = agent.AiApiKey;
        }

        var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(queryStr, provider ?? "OpenAI", apiKey);
        if (queryEmbedding == null) 
        {
            _logger.LogWarning("No se pudo generar el embedding para la búsqueda RAG.");
            return "El servicio de conocimiento corporativo no está disponible temporalmente.";
        }

        var baseQuery = _context.DocumentChunks.AsQueryable();
        
        // Regla de Visibilidad (Data Tenancy): Agencia actual o globales
        baseQuery = baseQuery.Where(c => c.AgenciaId == null || c.AgenciaId == currentAgencyId);

        if (context.Channel != "Copilot") 
        {
            baseQuery = baseQuery.Where(c => c.Audience == DocumentAudience.Public);
        }
        else
        {
            baseQuery = baseQuery.Where(c => c.Audience == DocumentAudience.Public || c.Audience == DocumentAudience.Internal);
        }

        List<DocumentChunk> topChunks;
        
        if (!_context.Database.IsRelational())
        {
            // Fallback for InMemory database testing since it doesn't support Vector or CosineDistance
            topChunks = await baseQuery
                .Where(c => c.Content.Contains(queryStr))
                .Take(3)
                .ToListAsync();
        }
        else if (provider == "Gemini")
        {
            topChunks = await baseQuery
                .Where(c => c.GeminiEmbedding != null)
                .OrderBy(c => c.GeminiEmbedding!.CosineDistance(queryEmbedding))
                .Take(3)
                .ToListAsync();
        }
        else
        {
            topChunks = await baseQuery
                .Where(c => c.Embedding != null)
                .OrderBy(c => c.Embedding!.CosineDistance(queryEmbedding))
                .Take(3)
                .ToListAsync();
        }

        if (topChunks.Any()) 
        {
            await LogAiActionAsync("ConsultaRAG", args.RootElement.GetRawText(), context);
            
            if (context.Channel == "Copilot")
            {
                var minifiedChunks = topChunks.Select(c => c.Content);
                return JsonSerializer.Serialize(minifiedChunks);
            }

            string contextText = string.Join("\n\n", topChunks.Select(c => $"[Contexto Corporativo]: {c.Content}"));
            return $"Utiliza OBLIGATORIAMENTE la siguiente información para responder a la duda del usuario. Si la respuesta no está aquí, dile que un humano le puede ayudar. NUNCA inventes políticas:\n\n{contextText}";
        }

        return "No encontré información sobre este tema en los documentos corporativos. Indica amablemente al usuario que no tienes ese dato e invítalo a hablar con un agente.";
    }
}





