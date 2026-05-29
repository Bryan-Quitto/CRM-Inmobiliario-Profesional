using System;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.Propiedades.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades.Jobs;

public class PropertyEmbeddingJob
{
    private readonly CrmDbContext _context;
    private readonly IPropertyEmbeddingService _embeddingService;
    private readonly ILogger<PropertyEmbeddingJob> _logger;

    public PropertyEmbeddingJob(
        CrmDbContext context,
        IPropertyEmbeddingService embeddingService,
        ILogger<PropertyEmbeddingJob> logger)
    {
        _context = context;
        _embeddingService = embeddingService;
        _logger = logger;
    }

    public async Task ProcessPropertyAsync(Guid propiedadId)
    {
        var property = await _context.Properties
            .Include(p => p.Agente)
            .FirstOrDefaultAsync(p => p.Id == propiedadId);
        if (property == null)
        {
            _logger.LogWarning("Property {PropiedadId} not found, skipping embedding generation.", propiedadId);
            return;
        }

        var vector = await _embeddingService.GenerateEmbeddingForPropertyAsync(property);
        if (vector != null)
        {
            property.VectorEmbedding = vector;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Successfully updated embedding for property {PropiedadId}.", propiedadId);
        }
        else
        {
            _logger.LogWarning("Failed to generate embedding for property {PropiedadId}.", propiedadId);
        }
    }
}
