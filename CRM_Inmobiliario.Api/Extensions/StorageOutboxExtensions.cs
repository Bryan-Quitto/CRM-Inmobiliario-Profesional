using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Extensions;

public static class StorageOutboxExtensions
{
    /// <summary>
    /// Encola llaves de Cloudflare R2 para borrado asíncrono y libera la cuota de almacenamiento del agente de forma optimista.
    /// Esta operación debe llamarse justo antes de context.SaveChangesAsync() o dentro de una transacción implícita como las generadas
    /// si se hacen operaciones normales o simplemente se aprovecha el ExecuteUpdateAsync/ExecuteDeleteAsync si se hacen por separado pero de forma transaccional.
    /// NOTA: Esta función realiza ExecuteUpdateAsync directamente en la base de datos, por lo que es inmediata y atómica.
    /// </summary>
    public static async Task QueueStorageDeletionsWithQuotaLiberationAsync(
        this CrmDbContext context,
        IEnumerable<string> objectKeys,
        Guid agentId,
        CancellationToken ct = default)
    {
        var keyList = objectKeys.ToList();
        if (keyList.Count == 0) return;

        var year = DateTime.UtcNow.Year;
        var month = DateTime.UtcNow.Month;
        var now = DateTimeOffset.UtcNow;

        // 1. Obtener la suma del tamaño de los archivos desde los logs que vamos a borrar
        // Solo sumamos los que no hayan sido borrados aún (IsDeleted = false)
        var logsToDelete = await context.AgentStorageFileLogs
            .Where(l => l.AgentId == agentId && keyList.Contains(l.ObjectKey) && !l.IsDeleted)
            .Select(l => new { l.Id, l.ObjectKey, l.FileSizeBytes })
            .ToListAsync(ct);

        long totalSizeToFree = logsToDelete.Sum(l => l.FileSizeBytes);

        if (totalSizeToFree > 0)
        {
            // 2. Liberar de forma optimista la cuota de uso del agente (Update)
            await context.AgentStorageUsages
                .Where(u => u.AgentId == agentId && u.Year == year && u.Month == month)
                .ExecuteUpdateAsync(s => s.SetProperty(
                    u => u.TotalBytesUploaded, 
                    u => Math.Max(0, u.TotalBytesUploaded - totalSizeToFree)), ct);
        }

        // 3. Marcar los logs de estos archivos como eliminados
        if (logsToDelete.Count > 0)
        {
            await context.AgentStorageFileLogs
                .Where(l => l.AgentId == agentId && keyList.Contains(l.ObjectKey) && !l.IsDeleted)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(l => l.IsDeleted, true)
                    .SetProperty(l => l.DeletedAt, now), ct);
        }

        // 4. Insertar los registros en la cola de Outbox (PendingStorageDeletions)
        // Ya que ExecuteUpdateAsync no funciona para Insert masivos fácilmente en EF Core 7/8 sin ExecuteSqlRaw,
        // Usamos AddRange y SaveChangesAsync.
        var outboxEntries = keyList.Select(key => new PendingStorageDeletion
        {
            Id = Guid.NewGuid(),
            ObjectKey = key,
            AgentId = agentId,
            FileSizeBytes = logsToDelete.FirstOrDefault(l => l.ObjectKey == key)?.FileSizeBytes ?? 0,
            CreatedAt = now,
            RetryCount = 0
        }).ToList();

        context.PendingStorageDeletions.AddRange(outboxEntries);
        await context.SaveChangesAsync(ct);
    }

    /// <summary>
    /// Encola una única llave de Cloudflare R2 para borrado asíncrono y libera la cuota de almacenamiento del agente de forma optimista.
    /// </summary>
    public static Task QueueStorageDeletionWithQuotaLiberationAsync(
        this CrmDbContext context,
        string objectKey,
        Guid agentId,
        CancellationToken ct = default)
    {
        return context.QueueStorageDeletionsWithQuotaLiberationAsync(new[] { objectKey }, agentId, ct);
    }
}
