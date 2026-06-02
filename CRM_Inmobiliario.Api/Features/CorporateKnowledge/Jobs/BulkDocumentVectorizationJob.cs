using System;
using System.Linq;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.CorporateKnowledge.Jobs;

public class BulkDocumentVectorizationJob
{
    private readonly CrmDbContext _context;
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly ILogger<BulkDocumentVectorizationJob> _logger;

    public BulkDocumentVectorizationJob(
        CrmDbContext context,
        IBackgroundJobClient backgroundJobs,
        ILogger<BulkDocumentVectorizationJob> logger)
    {
        _context = context;
        _backgroundJobs = backgroundJobs;
        _logger = logger;
    }

    public async Task ProcessBulkAsync(bool force)
    {
        _logger.LogInformation("Starting bulk document vectorization job. Force: {Force}", force);

        var query = _context.DocumentChunks.AsQueryable();

        bool hasGlobalOpenAI = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("OPENAI_API_KEY"));
        bool hasGlobalGemini = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("GEMINI_API_KEY"));

        if (!force)
        {
            query = query.Where(c => 
                (c.Embedding == null && hasGlobalOpenAI) ||
                (c.GeminiEmbedding == null && hasGlobalGemini)
            );
        }
        else
        {
            // If forcing, we only re-vectorize for globally active providers
            if (!hasGlobalOpenAI && !hasGlobalGemini)
            {
                _logger.LogWarning("Cannot force vectorization: no global API keys configured.");
                return;
            }
        }

        var chunkIds = await query.Select(c => c.Id).ToListAsync();

        _logger.LogInformation("Found {Count} document chunks to vectorize.", chunkIds.Count);

        foreach (var id in chunkIds)
        {
            _backgroundJobs.Enqueue<DocumentChunkEmbeddingJob>(j => j.ProcessChunkAsync(id, force));
        }

        _logger.LogInformation("Completed enqueuing {Count} document chunk embedding jobs.", chunkIds.Count);
    }
}
