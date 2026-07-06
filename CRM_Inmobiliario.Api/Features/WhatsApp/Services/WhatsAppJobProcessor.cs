using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Caching.Memory;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppJobProcessor
{
    Task ProcessMessageAsync(string phone, string body, string phoneNumberId, CancellationToken cancellationToken);
    Task ProcessAudioAsync(string phone, string mediaId, string phoneNumberId, CancellationToken cancellationToken);
}

public class WhatsAppJobProcessor : IWhatsAppJobProcessor
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WhatsAppJobProcessor> _logger;
    private readonly IMemoryCache _cache;

    public WhatsAppJobProcessor(IServiceScopeFactory scopeFactory, ILogger<WhatsAppJobProcessor> logger, IMemoryCache cache)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _cache = cache;
    }

    [Hangfire.AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 15, 45, 120 })]
    public async Task ProcessMessageAsync(string phone, string body, string phoneNumberId, CancellationToken cancellationToken)
    {
        var semaphore = _cache.GetOrCreate(phone, e => { e.SlidingExpiration = TimeSpan.FromMinutes(10); return new Lazy<SemaphoreSlim>(() => new SemaphoreSlim(1,1)); })!.Value;
        await semaphore.WaitAsync(cancellationToken);
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var aiService = scope.ServiceProvider.GetRequiredService<WhatsAppAiService>();

            await aiService.ProcessIncomingMessageAsync(phone, body, phoneNumberId, cancellationToken);
        }
        catch (Polly.Timeout.TimeoutRejectedException)
        {
            throw;
        }
        catch (Exception)
        {

            throw;
        }
        finally
        {
            semaphore.Release();
        }
    }

    [Hangfire.AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 15, 45, 120 })]
    public async Task ProcessAudioAsync(string phone, string mediaId, string phoneNumberId, CancellationToken cancellationToken)
    {
        var semaphore = _cache.GetOrCreate(phone, e => { e.SlidingExpiration = TimeSpan.FromMinutes(10); return new Lazy<SemaphoreSlim>(() => new SemaphoreSlim(1,1)); })!.Value;
        await semaphore.WaitAsync(cancellationToken);
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var aiService = scope.ServiceProvider.GetRequiredService<WhatsAppAiService>();
            var mediaService = scope.ServiceProvider.GetRequiredService<IWhatsAppMediaService>();

            using var stream = await mediaService.DownloadMediaAsync(mediaId);

            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream, cancellationToken);
            var audioBytes = memoryStream.ToArray();

            var supabase = scope.ServiceProvider.GetRequiredService<Supabase.Client>();
            var bucket = supabase.Storage.From("whatsapp_audio");
            var fileName = $"{Guid.NewGuid()}.ogg";
            await bucket.Upload(audioBytes, fileName, new Supabase.Storage.FileOptions 
            { 
                ContentType = "audio/ogg",
                Upsert = true
            });

            var mediaUrl = bucket.GetPublicUrl(fileName);


            await aiService.ProcessIncomingAudioAsync(phone, audioBytes, mediaUrl, phoneNumberId, cancellationToken);
        }
        catch (Polly.Timeout.TimeoutRejectedException)
        {
            throw;
        }
        catch (Exception)
        {

            throw;
        }
        finally
        {
            semaphore.Release();
        }
    }
}
