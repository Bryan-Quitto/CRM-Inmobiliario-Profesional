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
                
                using var scope = _serviceProvider.CreateScope();
                var r2Storage = scope.ServiceProvider.GetRequiredService<CRM_Inmobiliario.Api.Infrastructure.Services.IR2StorageService>();
                
                var fileName = $"ficha_{propiedadId}.pdf";
                var key = $"propiedades/{propiedadId}/{fileName}";
                await r2Storage.DeleteAsync(key);
            }
            catch (OperationCanceledException) { break; }
            catch (Exception)
            {
            }
        }
    }
}
