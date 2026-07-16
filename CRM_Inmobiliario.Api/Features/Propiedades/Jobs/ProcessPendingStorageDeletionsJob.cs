using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.Services;
using Hangfire;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Propiedades.Jobs;

public class ProcessPendingStorageDeletionsJob
{
    private readonly CrmDbContext _dbContext;
    private readonly IR2StorageService _r2StorageService;
    private readonly ILogger<ProcessPendingStorageDeletionsJob> _logger;

    public ProcessPendingStorageDeletionsJob(
        CrmDbContext dbContext,
        IR2StorageService r2StorageService,
        ILogger<ProcessPendingStorageDeletionsJob> logger)
    {
        _dbContext = dbContext;
        _r2StorageService = r2StorageService;
        _logger = logger;
    }

    [DisableConcurrentExecution(timeoutInSeconds: 30)]
    public async Task ExecuteAsync(CancellationToken cancellationToken = default)
    {
        // 1. Obtener lotes de hasta 100 archivos pendientes
        var pendingDeletions = await _dbContext.PendingStorageDeletions
            .OrderBy(p => p.RetryCount)
            .ThenBy(p => p.CreatedAt)
            .Take(100)
            .ToListAsync(cancellationToken);

        if (!pendingDeletions.Any()) return;

        _logger.LogInformation("Procesando {Count} archivos pendientes de eliminación en R2...", pendingDeletions.Count);

        var keysToDelete = pendingDeletions.Select(p => p.ObjectKey).Distinct().ToList();

        try
        {
            // 2. Intentar eliminarlos de R2
            // Usamos DeleteManyAsync en lugar de DeleteManyWithQuotaLiberationAsync porque la cuota ya fue liberada
            await _r2StorageService.DeleteManyAsync(keysToDelete);

            // 3. Si todo va bien, los borramos de la cola
            _dbContext.PendingStorageDeletions.RemoveRange(pendingDeletions);
            await _dbContext.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Se eliminaron correctamente {Count} archivos físicos de R2.", keysToDelete.Count);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Ocurrió un error al intentar eliminar archivos de R2 desde la cola.");

            // 4. Aumentar el RetryCount y registrar el error
            foreach (var pending in pendingDeletions)
            {
                pending.RetryCount++;
                pending.LastError = ex.Message.Length > 1000 ? ex.Message.Substring(0, 997) + "..." : ex.Message;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
