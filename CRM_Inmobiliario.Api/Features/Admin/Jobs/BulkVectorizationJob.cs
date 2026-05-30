using System;
using System.Linq;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Propiedades.Jobs;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Admin.Jobs;

public class BulkVectorizationJob
{
    private readonly CrmDbContext _context;
    private readonly IBackgroundJobClient _backgroundJobs;
    private readonly ILogger<BulkVectorizationJob> _logger;

    public BulkVectorizationJob(
        CrmDbContext context,
        IBackgroundJobClient backgroundJobs,
        ILogger<BulkVectorizationJob> logger)
    {
        _context = context;
        _backgroundJobs = backgroundJobs;
        _logger = logger;
    }

    public async Task ProcessBulkAsync(bool force)
    {
        _logger.LogInformation("Starting bulk vectorization job. Force: {Force}", force);

        var query = _context.Properties.AsQueryable();

        if (!force)
        {
            // Only backfill properties missing vectors based on their active provider
            query = query.Where(p => 
                (p.Agente != null && p.Agente.ActiveLLMProvider == "Gemini" && p.GeminiEmbedding == null) ||
                ((p.Agente == null || p.Agente.ActiveLLMProvider != "Gemini") && p.VectorEmbedding == null)
            );
        }

        var propertyIds = await query.Select(p => p.Id).ToListAsync();

        _logger.LogInformation("Found {Count} properties to vectorize.", propertyIds.Count);

        foreach (var id in propertyIds)
        {
            _backgroundJobs.Enqueue<PropertyEmbeddingJob>(j => j.ProcessPropertyAsync(id));
        }

        _logger.LogInformation("Completed enqueuing {Count} property embedding jobs.", propertyIds.Count);
    }
}
