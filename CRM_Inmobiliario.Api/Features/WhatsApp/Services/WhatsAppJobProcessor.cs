using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppJobProcessor
{
    Task ProcessMessageAsync(string phone, string body, string phoneNumberId);
    Task ProcessAudioAsync(string phone, string mediaId, string phoneNumberId);
}

public class WhatsAppJobProcessor : IWhatsAppJobProcessor
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<WhatsAppJobProcessor> _logger;

    public WhatsAppJobProcessor(IServiceScopeFactory scopeFactory, ILogger<WhatsAppJobProcessor> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task ProcessMessageAsync(string phone, string body, string phoneNumberId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var aiService = scope.ServiceProvider.GetRequiredService<WhatsAppAiService>();

            await aiService.ProcessIncomingMessageAsync(phone, body, phoneNumberId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook en background job para {Phone}", phone);
            throw; // Hangfire automáticamente reintentará el job si hay una excepción
        }
    }

    public async Task ProcessAudioAsync(string phone, string mediaId, string phoneNumberId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var aiService = scope.ServiceProvider.GetRequiredService<WhatsAppAiService>();
            var mediaService = scope.ServiceProvider.GetRequiredService<IWhatsAppMediaService>();

            // 1. Descargar el Stream del audio.
            using var stream = await mediaService.DownloadMediaAsync(mediaId);

            // Convertir a byte[]
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            var audioBytes = memoryStream.ToArray();

            // 2. Subir a Supabase Storage ("whatsapp_audio")
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

            // 3. Llamar a WhatsAppAiService pasándole el audio
            await aiService.ProcessIncomingAudioAsync(phone, audioBytes, mediaUrl, phoneNumberId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando audio en background job para {Phone} y Media {MediaId}", phone, mediaId);
            throw;
        }
    }
}
