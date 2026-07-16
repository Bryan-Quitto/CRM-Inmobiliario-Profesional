using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class ClosedPropertyMediaCleanupJob
{
    private readonly CrmDbContext _context;
    private readonly IR2StorageService _r2StorageService;
    private readonly ILogger<ClosedPropertyMediaCleanupJob> _logger;

    public ClosedPropertyMediaCleanupJob(
        CrmDbContext context,
        IR2StorageService r2StorageService,
        ILogger<ClosedPropertyMediaCleanupJob> logger)
    {
        _context = context;
        _r2StorageService = r2StorageService;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Iniciando tarea de limpieza de propiedades cerradas (Vendidas/Alquiladas > 1 año).");

        var oneYearAgo = DateTimeOffset.UtcNow.AddYears(-1);

        var propertiesToClean = await _context.Properties
            .Where(p => (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada") && p.FechaCierre != null && p.FechaCierre < oneYearAgo && p.FechaProgramadaLimpiezaR2 != null && p.FechaProgramadaLimpiezaR2 < DateTimeOffset.UtcNow && p.BloqueoLimpiezaOverride != false)
            .Include(p => p.Media)
            .Include(p => p.GallerySections)
            .ToListAsync();

        int totalDeleted = 0;

        foreach (var property in propertiesToClean)
        {
            var keysToDelete = new List<string>();

            // Antes de borrar secciones, salvaguardar la foto principal (portada) del borrado en cascada
            var principalMedia = property.Media.FirstOrDefault(m => m.EsPrincipal);
            if (principalMedia != null && principalMedia.SectionId != null)
            {
                principalMedia.SectionId = null;
            }

            // Añadir imágenes que no son principales
            var mediaToDelete = property.Media.Where(m => !m.EsPrincipal && !string.IsNullOrEmpty(m.StoragePath)).ToList();
            keysToDelete.AddRange(mediaToDelete.Select(m => $"propiedades/{property.Id}/{m.StoragePath}"));

            
            var pdfLogs = await _context.AgentStorageFileLogs
                .Where(l => l.TargetType == "Propiedad" && l.TargetId == property.Id.ToString() && l.Context == "PDF Ficha Comercial" && !l.IsDeleted)
                .ToListAsync();

            try
            {
                if (keysToDelete.Any())
                {
                    await _r2StorageService.DeleteManyAsync(keysToDelete);
                    totalDeleted += keysToDelete.Count;
                    _logger.LogInformation("Eliminados {Count} archivos de imagen para la propiedad Cerrada {Id}", keysToDelete.Count, property.Id);
                }
                
                foreach(var log in pdfLogs)
                {
                    await _r2StorageService.DeleteWithQuotaLiberationAsync(log.ObjectKey, log.AgentId);
                    totalDeleted++;
                }
            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "Error eliminando archivos de R2 para la propiedad Cerrada {Id}", property.Id);
            }

            // Marcar como limpio para no volver a procesar
            property.FechaProgramadaLimpiezaR2 = null;

            // Eliminar registros de la base de datos (excepto principal)
            _context.PropertyMedia.RemoveRange(mediaToDelete);
            _context.PropertyGallerySections.RemoveRange(property.GallerySections);
        }

        if (propertiesToClean.Any())
        {
            await _context.SaveChangesAsync();
        }

        _logger.LogInformation("ClosedPropertyMediaCleanupJob completado. Total archivos eliminados: {Total}", totalDeleted);
    }
}
