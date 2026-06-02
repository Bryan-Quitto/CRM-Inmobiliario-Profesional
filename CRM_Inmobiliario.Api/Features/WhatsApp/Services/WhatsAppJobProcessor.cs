using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

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
    private static readonly System.Collections.Concurrent.ConcurrentDictionary<string, SemaphoreSlim> _locks = new();

    public WhatsAppJobProcessor(IServiceScopeFactory scopeFactory, ILogger<WhatsAppJobProcessor> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    [Hangfire.AutomaticRetry(Attempts = 3, DelaysInSeconds = new[] { 15, 45, 120 })]
    public async Task ProcessMessageAsync(string phone, string body, string phoneNumberId, CancellationToken cancellationToken)
    {
        var semaphore = _locks.GetOrAdd(phone, _ => new SemaphoreSlim(1, 1));
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
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook en background job para {Phone}", phone);
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
        var semaphore = _locks.GetOrAdd(phone, _ => new SemaphoreSlim(1, 1));
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
            _logger.LogInformation("Audio subido a Supabase para {Phone}: {MediaUrl}", phone, mediaUrl);

            await aiService.ProcessIncomingAudioAsync(phone, audioBytes, mediaUrl, phoneNumberId, cancellationToken);
        }
        catch (Polly.Timeout.TimeoutRejectedException)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando audio en background job para {Phone} y Media {MediaId}", phone, mediaId);
            throw;
        }
        finally
        {
            semaphore.Release();
        }
    }
}
