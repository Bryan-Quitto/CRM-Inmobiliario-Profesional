using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using CRM_Inmobiliario.Api.Extensions;

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
        group.MapPost("/", async (
            HttpRequest request,
            Microsoft.Extensions.Caching.Memory.IMemoryCache cache,
            ILoggerFactory loggerFactory) =>
        {
            var logger = loggerFactory.CreateLogger("WhatsAppWebhook");
            
            try
            {
                var appSecret = Environment.GetEnvironmentVariable("WHATSAPP_APP_SECRET");
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

                using var hmac = new System.Security.Cryptography.HMACSHA256(System.Text.Encoding.UTF8.GetBytes(appSecret));
                var hashBytes = hmac.ComputeHash(System.Text.Encoding.UTF8.GetBytes(bodyString));
                var hashHex = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();
                
                if (signatureHeader.ToString() != "sha256=" + hashHex)
                {
                    logger.LogWarning("Firma inválida. Ataque detectado.");
                    return Results.StatusCode(401);
                }

                using var jsonDoc = JsonDocument.Parse(bodyString);
                var payload = jsonDoc.RootElement;
                // Extraer datos básicos del mensaje
                var entry = payload.GetProperty("entry")[0];
                var changes = entry.GetProperty("changes")[0];
                var value = changes.GetProperty("value");

                if (value.TryGetProperty("messages", out var messages))
                {
                    var message = messages[0];
                    string rawPhone = message.GetProperty("from").GetString() ?? string.Empty;
                    string phone = rawPhone.NormalizePhoneE164() ?? rawPhone;
                    string messageId = message.TryGetProperty("id", out var idProp) ? idProp.GetString() ?? string.Empty : string.Empty;
                    
                    if (!string.IsNullOrEmpty(messageId))
                    {
                        if (cache.TryGetValue($"wamid_{messageId}", out _))
                        {
                            logger.LogInformation("Mensaje duplicado ignorado por idempotencia: {MessageId}", messageId);
                            return Results.Ok();
                        }
                        cache.Set($"wamid_{messageId}", true, TimeSpan.FromHours(1));
                    }
                    
                    string phoneNumberId = string.Empty;
                    if (value.TryGetProperty("metadata", out var metadata) && 
                        metadata.TryGetProperty("phone_number_id", out var phoneNumberIdProp))
                    {
                        phoneNumberId = phoneNumberIdProp.GetString() ?? string.Empty;
                    }
                    
                    if (message.TryGetProperty("type", out var typeProp))
                    {
                        var type = typeProp.GetString();
                        if (type == "text" && message.TryGetProperty("text", out var text))
                        {
                            string body = text.GetProperty("body").GetString() ?? string.Empty;
                            
                            // Encolamiento persistente y resiliente en Hangfire
                            Hangfire.BackgroundJob.Enqueue<Services.IWhatsAppJobProcessor>(
                                x => x.ProcessMessageAsync(phone, body, phoneNumberId, CancellationToken.None));
                        }
                        else if (type == "audio" && message.TryGetProperty("audio", out var audio))
                        {
                            string mediaId = audio.GetProperty("id").GetString() ?? string.Empty;
                            
                            if (!string.IsNullOrEmpty(mediaId))
                            {
                                Hangfire.BackgroundJob.Enqueue<Services.IWhatsAppJobProcessor>(
                                    x => x.ProcessAudioAsync(phone, mediaId, phoneNumberId, CancellationToken.None));
                            }
                        }
                        else if (!string.IsNullOrEmpty(type))
                        {
                            string tipoFormateado = type switch
                            {
                                "image" => "Imagen",
                                "document" => "Documento",
                                "video" => "Video",
                                "sticker" => "Sticker",
                                "audio" => "Audio",
                                _ => type
                            };
                            string body = $"[Media: {tipoFormateado}]";
                            
                            Hangfire.BackgroundJob.Enqueue<Services.IWhatsAppJobProcessor>(
                                x => x.ProcessMessageAsync(phone, body, phoneNumberId, CancellationToken.None));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error extrayendo datos del webhook o encolando en Hangfire");
            }

            return Results.Ok();
        })
        .WithName("RecibirEventoWhatsApp");
    }
}
