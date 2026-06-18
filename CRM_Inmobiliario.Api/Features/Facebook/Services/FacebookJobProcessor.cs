using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

public sealed class FacebookJobProcessor : IFacebookJobProcessor
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<FacebookJobProcessor> _logger;
    private readonly IMemoryCache _cache;

    public FacebookJobProcessor(IServiceScopeFactory scopeFactory, ILogger<FacebookJobProcessor> logger, IMemoryCache cache)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _cache = cache;
    }

    [Hangfire.AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 15, 45, 120 })]
    public async Task ProcessMessageAsync(string senderId, string text, string pageId, string? codigoCorto = null, CancellationToken cancellationToken = default)
    {
        // Serialización por PSID: mensajes del mismo usuario se procesan uno a la vez
        var semaphore = _cache.GetOrCreate(
            $"fb_{senderId}",
            e => { e.SlidingExpiration = TimeSpan.FromMinutes(10); return new Lazy<SemaphoreSlim>(() => new SemaphoreSlim(1, 1)); })!.Value;

        await semaphore.WaitAsync(cancellationToken);
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var aiService = scope.ServiceProvider.GetRequiredService<FacebookAiService>();
            await aiService.ProcessMessageAsync(senderId, text, pageId, codigoCorto, cancellationToken);
        }
        catch (Polly.Timeout.TimeoutRejectedException)
        {
            throw; // Hangfire retirará por nosotros
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error en background job de Facebook para PSID {SenderId}", senderId);
            throw;
        }
        finally
        {
            semaphore.Release();
        }
    }
}
