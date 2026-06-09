using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using CRM_Inmobiliario.Api.Features.Facebook.Services;

namespace CRM_Inmobiliario.Api.Features.Facebook;

public static class FacebookWebhooksFeature
{
    public static void MapFacebookWebhooksEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/webhooks/facebook")
            .WithTags("Facebook")
            .AllowAnonymous();

        // GET: Verificación inicial del Webhook (Meta challenge-response)
        group.MapGet("/", (
            [FromQuery(Name = "hub.mode")] string? mode,
            [FromQuery(Name = "hub.verify_token")] string? token,
            [FromQuery(Name = "hub.challenge")] string? challenge) =>
        {
            var verifyToken = Environment.GetEnvironmentVariable("FACEBOOK_VERIFY_TOKEN");
            if (mode == "subscribe" && token == verifyToken)
                return Results.Content(challenge ?? string.Empty, "text/plain");
            return Results.StatusCode(403);
        })
        .WithName("ValidarWebhookFacebook");

        // POST: Recepción de eventos de Messenger en tiempo real
        group.MapPost("/", async (
            HttpRequest request,
            IMemoryCache cache,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("FacebookWebhook");
            try
            {
                var appSecret = Environment.GetEnvironmentVariable("FACEBOOK_APP_SECRET");
                if (string.IsNullOrEmpty(appSecret)) return Results.StatusCode(500);

                if (!request.Headers.TryGetValue("X-Hub-Signature-256", out var signatureHeader))
                {
                    logger.LogWarning("Petición sin firma X-Hub-Signature-256");
                    return Results.StatusCode(401);
                }

                request.EnableBuffering();
                using var reader = new System.IO.StreamReader(request.Body, System.Text.Encoding.UTF8, leaveOpen: true);
                var bodyString = await reader.ReadToEndAsync();
                request.Body.Position = 0;

                // Validación HMAC-SHA256 — misma firma que WhatsApp porque comparten App de Meta
                using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(appSecret));
                var hashBytes = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(bodyString));
                var hashHex = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                if (signatureHeader.ToString() != "sha256=" + hashHex)
                {
                    logger.LogWarning("Firma inválida en webhook de Facebook. Posible ataque.");
                    return Results.StatusCode(401);
                }

                using var jsonDoc = JsonDocument.Parse(bodyString);
                var root = jsonDoc.RootElement;

                // Verificar que el evento pertenece a una página de Facebook (no a Instagram, etc.)
                if (!root.TryGetProperty("object", out var objProp) || objProp.GetString() != "page")
                    return Results.Ok();

                if (!root.TryGetProperty("entry", out var entries)) return Results.Ok();

                foreach (var entry in entries.EnumerateArray())
                {
                    var pageId = entry.TryGetProperty("id", out var pidProp)
                        ? pidProp.GetString() ?? string.Empty
                        : string.Empty;

                    if (!entry.TryGetProperty("messaging", out var messaging)) continue;

                    foreach (var messagingEvent in messaging.EnumerateArray())
                    {
                        if (!messagingEvent.TryGetProperty("message", out var message)) continue;
                        if (!messagingEvent.TryGetProperty("sender", out var sender)) continue;

                        var senderId = sender.TryGetProperty("id", out var senderIdProp)
                            ? senderIdProp.GetString() ?? string.Empty
                            : string.Empty;

                        var messageId = message.TryGetProperty("mid", out var midProp)
                            ? midProp.GetString() ?? string.Empty
                            : string.Empty;

                        // Idempotencia: ignorar mensajes duplicados por retries de Meta
                        if (!string.IsNullOrEmpty(messageId))
                        {
                            if (cache.TryGetValue($"fb_msg_{messageId}", out _))
                            {
                                logger.LogInformation("Mensaje duplicado de Facebook ignorado: {MessageId}", messageId);
                                continue;
                            }
                            cache.Set($"fb_msg_{messageId}", true, TimeSpan.FromHours(1));
                        }

                        // Ignorar likes, stickers, reacciones — solo texto
                        if (!message.TryGetProperty("text", out var textProp)) continue;
                        var text = textProp.GetString() ?? string.Empty;
                        if (string.IsNullOrWhiteSpace(text) || string.IsNullOrWhiteSpace(senderId)) continue;

                        // Encolamiento en Hangfire para procesamiento IA asíncrono y resiliente
                        Hangfire.BackgroundJob.Enqueue<IFacebookJobProcessor>(
                            x => x.ProcessMessageAsync(senderId, text, pageId, CancellationToken.None));
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error procesando webhook de Facebook");
            }

            // Siempre 200 para evitar retries infinitos de Meta
            return Results.Ok();
        })
        .WithName("RecibirEventoFacebook");
    }
}
