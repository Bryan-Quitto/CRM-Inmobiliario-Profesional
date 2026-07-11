using System;
using System.Linq;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class InactivePropertyMediaCleanupJob
{
    private readonly CrmDbContext _context;
    private readonly IR2StorageService _r2StorageService;
    private readonly ILogger<InactivePropertyMediaCleanupJob> _logger;

    public InactivePropertyMediaCleanupJob(
        CrmDbContext context,
        IR2StorageService r2StorageService,
        ILogger<InactivePropertyMediaCleanupJob> logger)
    {
        _context = context;
        _r2StorageService = r2StorageService;
        _logger = logger;
    }

    public async Task ExecuteAsync()
    {
        _logger.LogInformation("Iniciando tarea de limpieza de propiedades archivadas.");

        var utcMinus5 = new DateTimeOffset(DateTime.UtcNow).ToOffset(TimeSpan.FromHours(-5));
        var cutoffGlobal = utcMinus5.AddDays(-365);
        var fechaProgramada = utcMinus5.AddDays(31);

        // 1. Cancelar limpiezas que ya no aplican (actividad reciente o estado protegido)
        var sqlCancelCleanup = $@"
            UPDATE ""Properties"" p
            SET ""FechaProgramadaLimpiezaR2"" = NULL
            WHERE p.""FechaProgramadaLimpiezaR2"" IS NOT NULL
            AND (
                p.""EstadoComercial"" = 'Vendida' OR p.""EstadoComercial"" = 'Alquilada'
                OR
                COALESCE(
                    (SELECT MAX(""LastActivityUtc"") FROM ""AgentPropertyActivities"" apa WHERE apa.""PropertyId"" = p.""Id""),
                    p.""FechaIngreso""
                ) > '{cutoffGlobal:O}'
            );";
        await _context.Database.ExecuteSqlRawAsync(sqlCancelCleanup);

        // 2. Programar nuevas limpiezas
        var sqlProgramCleanup = $@"
            UPDATE ""Properties"" p
            SET ""FechaProgramadaLimpiezaR2"" = '{fechaProgramada:O}'
            WHERE p.""FechaProgramadaLimpiezaR2"" IS NULL
            AND p.""EstadoComercial"" != 'Vendida' AND p.""EstadoComercial"" != 'Alquilada'
            AND (
                COALESCE(
                    (SELECT MAX(""LastActivityUtc"") FROM ""AgentPropertyActivities"" apa WHERE apa.""PropertyId"" = p.""Id""),
                    p.""FechaIngreso""
                ) <= '{cutoffGlobal:O}'
            );";
        await _context.Database.ExecuteSqlRawAsync(sqlProgramCleanup);

        // 3. Obtener propiedades pendientes de limpieza física en R2
        var propertiesToClean = await _context.Properties
            .Include(p => p.Media)
            .Include(p => p.GallerySections)
            .Where(p => p.FechaProgramadaLimpiezaR2 != null && p.FechaProgramadaLimpiezaR2 <= utcMinus5)
            .ToListAsync();

        if (!propertiesToClean.Any())
        {
            _logger.LogInformation("No se encontraron propiedades pendientes de limpieza de R2.");
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

            // Resetear el flag
            property.FechaProgramadaLimpiezaR2 = null;
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
