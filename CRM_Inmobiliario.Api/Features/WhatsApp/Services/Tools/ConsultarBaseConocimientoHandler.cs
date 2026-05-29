using System.Text.Json;
using System.Text;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Domain.Enums;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Pgvector.EntityFrameworkCore;
using OpenAI.Embeddings;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;

public sealed class ConsultarBaseConocimientoHandler : BaseWhatsAppToolHandler
{
    private readonly CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService _embeddingService;

    public ConsultarBaseConocimientoHandler(CrmDbContext context, ILogger<ConsultarBaseConocimientoHandler> logger, CRM_Inmobiliario.Api.Features.Propiedades.Services.IPropertyEmbeddingService embeddingService) 
        : base(context, logger) 
    { 
        _embeddingService = embeddingService;
    }

    public override string ToolName => "ConsultarBaseConocimiento";

    public override async Task<string> ExecuteAsync(JsonDocument args, string phone, string triggerMessage, Contacto? contacto, string phoneNumberId)
    {
        string? queryStr = args.RootElement.TryGetProperty("query", out var q) ? q.GetString() : null;

        _logger.LogInformation("Iniciando consulta corporativa (RAG): Query={Query}", queryStr ?? "Ninguno");

        if (string.IsNullOrEmpty(queryStr))
        {
            return "No se especificó la pregunta para consultar en la base de datos corporativa.";
        }

        var queryEmbedding = await _embeddingService.GenerateEmbeddingAsync(queryStr);
        if (queryEmbedding == null) 
        {
            _logger.LogWarning("No se pudo generar el embedding para la búsqueda RAG.");
            return "El servicio de conocimiento corporativo no está disponible temporalmente.";
        }

        var baseQuery = _context.DocumentChunks
            .Where(c => c.Audience == DocumentAudience.Public);

        var topChunks = await baseQuery
            .OrderBy(c => c.Embedding!.CosineDistance(queryEmbedding))
            .Take(3)
            .ToListAsync();

        if (topChunks.Any()) 
        {
            await LogAiActionAsync("ConsultaRAG", args.RootElement.GetRawText(), phone, triggerMessage, contacto?.Id);
            
            string contextText = string.Join("\n\n", topChunks.Select(c => $"[Contexto Corporativo]: {c.Content}"));
            return $"Utiliza OBLIGATORIAMENTE la siguiente información para responder a la duda del usuario. Si la respuesta no está aquí, dile que un humano le puede ayudar. NUNCA inventes políticas:\n\n{contextText}";
        }

        return "No encontré información sobre este tema en los documentos corporativos. Indica amablemente al usuario que no tienes ese dato e invítalo a hablar con un asesor.";
    }
}
