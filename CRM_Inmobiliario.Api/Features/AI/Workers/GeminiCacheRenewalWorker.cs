using System;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.AI.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.AI.Workers;

public class GeminiCacheRenewalWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<GeminiCacheRenewalWorker> _logger;

    public GeminiCacheRenewalWorker(IServiceProvider serviceProvider, ILogger<GeminiCacheRenewalWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(3));

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var renewalProcessor = scope.ServiceProvider.GetRequiredService<ICacheRenewalProcessor>();
                
                await renewalProcessor.ProcessRenewalsAsync(stoppingToken);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Bucle de renovación interrumpido forzosamente. Llave BYOK invalidada o worker detenido.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error no controlado en la renovación de caché de Gemini.");
            }
        }
    }
}
