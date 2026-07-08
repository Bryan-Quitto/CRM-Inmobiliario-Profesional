using System;
using System.Linq;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class ArchivedPropertyCleanupJob
{
    private readonly CrmDbContext _context;
    private readonly IR2StorageService _r2StorageService;
    private readonly ILogger<ArchivedPropertyCleanupJob> _logger;

    public ArchivedPropertyCleanupJob(
        CrmDbContext context,
        IR2StorageService r2StorageService,
        ILogger<ArchivedPropertyCleanupJob> logger)
    {
        _context = context;
        _r2StorageService = r2StorageService;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Iniciando tarea de limpieza de propiedades archivadas.");

        // Límite de 31 días hacia atrás
        var cutoffDate = DateTimeOffset.UtcNow.AddDays(-31);

        var propertiesToClean = await _context.Properties
            .Include(p => p.Media)
            .Where(p => p.EstadoComercial == "Archivado" && 
                        p.FechaArchivado != null && 
                        p.FechaArchivado <= cutoffDate)
            .ToListAsync();

        if (!propertiesToClean.Any())
        {
            _logger.LogInformation("No se encontraron propiedades archivadas hace más de 31 días que requieran limpieza.");
            return;
        }

        int totalMediaDeleted = 0;
        int totalPdfDeleted = 0;

        foreach (var property in propertiesToClean)
        {
            // Omitimos propiedades que ya fueron limpiadas (sin Media) para optimizar
            // Sin embargo, queremos re-intentar borrar el PDF por si acaso.
            
            // 1. Recopilar claves de R2 a eliminar
            var keysToDelete = property.Media
                .Where(m => !string.IsNullOrEmpty(m.UrlPublica))
                .Select(m => ExtraerClaveR2(m.UrlPublica))
                .Where(k => !string.IsNullOrEmpty(k))
                .Cast<string>()
                .ToList();

            // Agregar el PDF a la lista de claves a eliminar
            var pdfKey = $"propiedades/{property.Id}/ficha_{property.Id}.pdf";
            keysToDelete.Add(pdfKey);

            // 2. Eliminar físicamente de R2
            if (keysToDelete.Any())
            {
                try
                {
                    await _r2StorageService.DeleteManyAsync(keysToDelete);
                    totalMediaDeleted += property.Media.Count;
                    totalPdfDeleted++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al eliminar archivos de R2 para la propiedad {PropertyId}.", property.Id);
                    continue; // Saltar si falla la eliminación física para no borrar de la base prematuramente
                }
            }

            // 3. Eliminar de la base de datos (Eliminación fuerte)
            if (property.Media.Any())
            {
                _context.PropertyMedia.RemoveRange(property.Media);
            }
        }

        // 4. Guardar los cambios en la DB
        int dbChanges = await _context.SaveChangesAsync();

        _logger.LogInformation("Limpieza completada. {Count} propiedades procesadas. {Media} imágenes eliminadas, {Pdf} PDFs eliminados. Cambios en DB: {DbChanges}.", 
            propertiesToClean.Count, totalMediaDeleted, totalPdfDeleted, dbChanges);
    }

    private string? ExtraerClaveR2(string? url)
    {
        if (string.IsNullOrEmpty(url)) return null;

        try
        {
            var uri = new Uri(url);
            // El AbsolutePath suele incluir el primer slash, por lo que lo removemos para obtener la clave S3.
            return uri.AbsolutePath.TrimStart('/');
        }
        catch
        {
            return null; // Ignorar URLs inválidas
        }
    }
}
