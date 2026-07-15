using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class LimpiezaPdfsObsoletosJob
{
    private readonly CrmDbContext _context;
    private readonly IR2StorageService _r2Storage;
    private readonly ILogger<LimpiezaPdfsObsoletosJob> _logger;

    public LimpiezaPdfsObsoletosJob(
        CrmDbContext context,
        IR2StorageService r2Storage,
        ILogger<LimpiezaPdfsObsoletosJob> logger)
    {
        _context = context;
        _r2Storage = r2Storage;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Iniciando tarea de limpieza de PDFs obsoletos.");

        var propiedadesActualizadas = await _context.Properties
            .Where(p => p.FechaActualizacion != null)
            .Select(p => new { p.Id, p.FechaActualizacion })
            .ToListAsync(cancellationToken);

        int eliminados = 0;

        foreach (var propiedad in propiedadesActualizadas)
        {
            var pdfLogs = await _context.AgentStorageFileLogs
                .Where(l => l.TargetType == "Propiedad" && l.TargetId == propiedad.Id.ToString() && l.Context == "PDF Ficha Comercial" && !l.IsDeleted)
                .ToListAsync(cancellationToken);

            foreach (var log in pdfLogs)
            {
                if (propiedad.FechaActualizacion!.Value > log.UploadedAt)
                {
                    _logger.LogInformation("Eliminando PDF obsoleto para la propiedad {Id} y agente {AgentId}", propiedad.Id, log.AgentId);
                    await _r2Storage.DeleteWithQuotaLiberationAsync(log.ObjectKey, log.AgentId);
                    eliminados++;
                }
            }
        }

        _logger.LogInformation("Tarea de limpieza finalizada. PDFs eliminados: {Count}", eliminados);
    }
}
