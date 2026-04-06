using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class PdfCleanupWorker : BackgroundService
{
    private readonly IPdfCleanupQueue _queue;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<PdfCleanupWorker> _logger;

    public PdfCleanupWorker(IPdfCleanupQueue queue, IServiceProvider serviceProvider, ILogger<PdfCleanupWorker> logger)
    {
        _queue = queue;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        _logger.LogInformation("🧹 [CLEANUP] Worker de limpieza de PDFs iniciado.");

        while (!ct.IsCancellationRequested)
        {
            try
            {
                var (propiedadId, deletionTime) = await _queue.DequeueDeletionAsync(ct);
                
                var waitTime = deletionTime - DateTime.UtcNow;
                if (waitTime.TotalMilliseconds > 0)
                {
                    await Task.Delay(waitTime, ct);
                }

                _logger.LogInformation("🗑️ [CLEANUP] Ejecutando eliminación de PDF para Propiedad: {PropiedadId}", propiedadId);
                
                using var scope = _serviceProvider.CreateScope();
                var supabase = scope.ServiceProvider.GetRequiredService<Supabase.Client>();
                
                var fileName = $"ficha_{propiedadId}.pdf";
                await supabase.Storage.From("propiedades").Remove(new List<string> { fileName });

                _logger.LogInformation("✅ [CLEANUP] PDF {FileName} eliminado correctamente de Supabase.", fileName);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [CLEANUP] Error durante la limpieza de un PDF.");
            }
        }
    }
}
