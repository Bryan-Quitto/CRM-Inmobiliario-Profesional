using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class InactivePropertyMediaCleanupJob
{
    private readonly CrmDbContext _context;
    private readonly IR2StorageService _r2Storage;
    private readonly ILogger<InactivePropertyMediaCleanupJob> _logger;

    public InactivePropertyMediaCleanupJob(
        CrmDbContext context,
        IR2StorageService r2Storage,
        ILogger<InactivePropertyMediaCleanupJob> logger)
    {
        _context = context;
        _r2Storage = r2Storage;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Iniciando InactivePropertyMediaCleanupJob...");

        var cutoffDate = DateTimeOffset.UtcNow.AddDays(-1); // Propiedades inactivas por más de 24 horas

        var propertiesToClean = await _context.Properties
            .Where(p => p.EstadoComercial == "Inactiva" && p.FechaArchivado != null && p.FechaArchivado < cutoffDate && p.FechaProgramadaLimpiezaR2 != null && p.FechaProgramadaLimpiezaR2 < DateTimeOffset.UtcNow)
            .Include(p => p.Media)
            .ToListAsync(cancellationToken);

        int totalDeleted = 0;

        foreach (var property in propertiesToClean)
        {
            var keysToDelete = new List<string>();

            // Añadir imágenes que no son principales
            var mediaToDelete = property.Media.Where(m => !m.EsPrincipal && !string.IsNullOrEmpty(m.StoragePath)).ToList();
            keysToDelete.AddRange(mediaToDelete.Select(m => $"propiedades/{property.Id}/{m.StoragePath}"));

            
            var pdfLogs = await _context.AgentStorageFileLogs
                .Where(l => l.TargetType == "Propiedad" && l.TargetId == property.Id.ToString() && l.Context == "PDF Ficha Comercial" && !l.IsDeleted)
                .ToListAsync(cancellationToken);

            try
            {
                if (keysToDelete.Any())
                {
                    await _r2Storage.DeleteManyAsync(keysToDelete);
                    totalDeleted += keysToDelete.Count;
                    _logger.LogInformation("Eliminados {Count} archivos de imagen para la propiedad Inactiva {Id}", keysToDelete.Count, property.Id);
                }
                
                foreach(var log in pdfLogs)
                {
                    await _context.QueueStorageDeletionWithQuotaLiberationAsync(log.ObjectKey, log.AgentId, cancellationToken);
                    totalDeleted++;
                }
            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando archivos de R2 para la propiedad {Id}", property.Id);
            }

            // Marcar como limpio para no volver a procesar
            property.FechaProgramadaLimpiezaR2 = null;

            // Eliminar registros de la base de datos (excepto principal)
            _context.PropertyMedia.RemoveRange(mediaToDelete);
        }

        if (propertiesToClean.Any())
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        _logger.LogInformation("InactivePropertyMediaCleanupJob completado. Total archivos eliminados: {Total}", totalDeleted);
    }
}
