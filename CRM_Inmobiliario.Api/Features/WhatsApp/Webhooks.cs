using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace CRM_Inmobiliario.Api.Features.WhatsApp;

public static class WebhooksFeature
{
    public static void MapWhatsAppWebhooksEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/webhooks/whatsapp")
            .WithTags("WhatsApp")
            .AllowAnonymous();

        // GET: Validación del Webhook de Meta
        group.MapGet("/", (
            [FromQuery(Name = "hub.mode")] string? mode,
            [FromQuery(Name = "hub.verify_token")] string? token,
            [FromQuery(Name = "hub.challenge")] string? challenge) =>
        {
            var verifyToken = Environment.GetEnvironmentVariable("WHATSAPP_VERIFY_TOKEN");

            if (mode == "subscribe" && token == verifyToken)
            {
                return Results.Content(challenge ?? string.Empty, "text/plain");
            }

            return Results.StatusCode(403);
        })
        .WithName("ValidarWebhookWhatsApp");

        // POST: Recepción de eventos
        group.MapPost("/", (
            [FromBody] JsonElement payload,
            IServiceScopeFactory scopeFactory,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("WhatsAppWebhook");
            
            // Procesamiento en segundo plano para responder rápido a Meta (<3s)
            _ = Task.Run(async () =>
            {
                try
                {
                    using var scope = scopeFactory.CreateScope();
                    var aiService = scope.ServiceProvider.GetRequiredService<WhatsAppAiService>();

                    // Extraer datos básicos del mensaje
                    var entry = payload.GetProperty("entry")[0];
                    var changes = entry.GetProperty("changes")[0];
                    var value = changes.GetProperty("value");

                    if (value.TryGetProperty("messages", out var messages))
                    {
                        var message = messages[0];
                        string phone = message.GetProperty("from").GetString() ?? string.Empty;
                        
                        if (message.TryGetProperty("text", out var text))
                        {
                            string body = text.GetProperty("body").GetString() ?? string.Empty;
                            await aiService.ProcessIncomingMessageAsync(phone, body);
                        }
                    }
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error procesando webhook de WhatsApp");
                }
            });

            return Results.Ok();
        })
        .WithName("RecibirEventoWhatsApp");
    }
}
