using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppJobProcessor
{
    Task ProcessMessageAsync(string phone, string body);
    Task ProcessAudioAsync(string phone, string mediaId);
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

    public async Task ProcessMessageAsync(string phone, string body)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var aiService = scope.ServiceProvider.GetRequiredService<WhatsAppAiService>();

            await aiService.ProcessIncomingMessageAsync(phone, body);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando webhook en background job para {Phone}", phone);
            throw; // Hangfire automáticamente reintentará el job si hay una excepción
        }
    }

    public async Task ProcessAudioAsync(string phone, string mediaId)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var aiService = scope.ServiceProvider.GetRequiredService<WhatsAppAiService>();
            var mediaService = scope.ServiceProvider.GetRequiredService<IWhatsAppMediaService>();

            // 1. Descargar el Stream del audio.
            using var stream = await mediaService.DownloadMediaAsync(mediaId);

            // 2. Inicializar AudioClient de OpenAI.
            var apiKey = Environment.GetEnvironmentVariable("OPENAI_API_KEY") 
                         ?? throw new InvalidOperationException("OPENAI_API_KEY not found.");
            var audioClient = new OpenAI.Audio.AudioClient("whisper-1", apiKey);

            // 3. Ejecutar transcripción.
            var options = new OpenAI.Audio.AudioTranscriptionOptions
            {
                ResponseFormat = OpenAI.Audio.AudioTranscriptionFormat.Verbose
            };
            
            // Assuming TranscribeAudioAsync takes stream and filename
            var transcriptionResult = await audioClient.TranscribeAudioAsync(stream, "audio.ogg", options);
            var transcription = transcriptionResult.Value.Text;

            // 4. Llamar a WhatsAppAiService.ProcessIncomingMessageAsync(phone, transcripcion)
            _logger.LogInformation("Transcripción obtenida para {Phone}: {Text}", phone, transcription);
            await aiService.ProcessIncomingMessageAsync(phone, transcription);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error procesando audio en background job para {Phone} y Media {MediaId}", phone, mediaId);
            throw;
        }
    }
}
