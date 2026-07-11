using System;
using System.Linq;
using System.Threading.Tasks;
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

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Iniciando tarea de limpieza de propiedades cerradas (Vendidas/Alquiladas > 1 año).");

        var utcNow = DateTimeOffset.UtcNow;

        var propertiesToClean = await _context.Properties
            .Include(p => p.Media)
            .Include(p => p.GallerySections)
            .Where(p => (p.EstadoComercial == "Vendida" || p.EstadoComercial == "Alquilada") 
                        && p.FechaCierre != null 
                        && p.FechaCierre <= utcNow.AddYears(-1)
                        && (p.Media.Any(m => !m.EsPrincipal) || p.GallerySections.Any()))
            .ToListAsync();

        if (!propertiesToClean.Any())
        {
            _logger.LogInformation("No se encontraron propiedades cerradas pendientes de limpieza de R2.");
            return;
        }

        int totalMediaDeleted = 0;
        int totalPdfDeleted = 0;

        foreach (var property in propertiesToClean)
        {
            var mediaToDelete = property.Media.Where(m => !m.EsPrincipal).ToList();

            // 1. Recopilar claves de R2 a eliminar
            var keysToDelete = mediaToDelete
                .Select(m => !string.IsNullOrEmpty(m.StoragePath) 
                    ? $"propiedades/{property.Id}/{m.StoragePath}" 
                    : ExtraerClaveR2(m.UrlPublica))
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
                    totalMediaDeleted += mediaToDelete.Count;
                    totalPdfDeleted++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error al eliminar archivos de R2 para la propiedad {PropertyId}.", property.Id);
                    continue; // Saltar si falla la eliminación física para no borrar de la base prematuramente
                }
            }

            // 3. Eliminar de la base de datos (Eliminación fuerte)
            if (mediaToDelete.Any())
            {
                _context.PropertyMedia.RemoveRange(mediaToDelete);
            }
            
            // Rescatar foto principal si estaba dentro de una sección para que no se borre en cascada
            var principalMedia = property.Media.FirstOrDefault(m => m.EsPrincipal);
            if (principalMedia != null && principalMedia.SectionId != null)
            {
                principalMedia.SectionId = null;
            }

            if (property.GallerySections.Any())
            {
                _context.PropertyGallerySections.RemoveRange(property.GallerySections);
            }

            // Limpiar la alerta roja una vez eliminados físicamente
            property.FechaProgramadaLimpiezaR2 = null;
        }

        // 4. Guardar los cambios en la DB
        int dbChanges = await _context.SaveChangesAsync();

        _logger.LogInformation("Limpieza de propiedades cerradas completada. {Count} propiedades procesadas. {Media} imágenes eliminadas, {Pdf} PDFs eliminados. Cambios en DB: {DbChanges}.", 
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
