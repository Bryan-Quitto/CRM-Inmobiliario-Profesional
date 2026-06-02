using System;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Propiedades.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.CorporateKnowledge.Jobs;

public class DocumentChunkEmbeddingJob
{
    private readonly CrmDbContext _context;
    private readonly IPropertyEmbeddingService _embeddingService;
    private readonly ILogger<DocumentChunkEmbeddingJob> _logger;
    private readonly string? _openAiApiKey;
    private readonly string? _geminiApiKey;

    public DocumentChunkEmbeddingJob(
        CrmDbContext context,
        IPropertyEmbeddingService embeddingService,
        ILogger<DocumentChunkEmbeddingJob> logger)
    {
        _context = context;
        _embeddingService = embeddingService;
        _logger = logger;
        _openAiApiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY")?.Trim().Trim('"');
        _geminiApiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY")?.Trim().Trim('"');
    }

    public async Task ProcessChunkAsync(Guid chunkId, bool force = false)
    {
        var chunk = await _context.DocumentChunks.FindAsync(chunkId);
        if (chunk == null)
        {
            _logger.LogWarning("DocumentChunk {ChunkId} not found, skipping embedding generation.", chunkId);
            return;
        }

        bool generatedAny = false;
        
        if ((chunk.Embedding == null || force) && !string.IsNullOrEmpty(_openAiApiKey))
        {
            var vector = await _embeddingService.GenerateEmbeddingAsync(chunk.Content, "OpenAI", _openAiApiKey);
            if (vector != null)
            {
                chunk.Embedding = vector;
                generatedAny = true;
            }
        }

        if ((chunk.GeminiEmbedding == null || force) && !string.IsNullOrEmpty(_geminiApiKey))
        {
            var vector = await _embeddingService.GenerateEmbeddingAsync(chunk.Content, "Gemini", _geminiApiKey);
            if (vector != null)
            {
                chunk.GeminiEmbedding = vector;
                generatedAny = true;
            }
        }

        if (generatedAny)
        {
            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully updated embedding for document chunk {ChunkId}.", chunkId);
        }
        else
        {
            _logger.LogWarning("Failed to generate embedding for document chunk {ChunkId}.", chunkId);
        }
    }
}
