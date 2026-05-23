using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppJobProcessor
{
    Task ProcessMessageAsync(string phone, string body);
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
}
