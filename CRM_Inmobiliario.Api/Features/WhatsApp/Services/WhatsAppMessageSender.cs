using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Domain.Entities;
using Hangfire;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public sealed class WhatsAppMessageSender : IWhatsAppMessageSender
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<WhatsAppMessageSender> _logger;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly string? _whatsappToken;
    private readonly string? _whatsappPhoneId;

    public WhatsAppMessageSender(HttpClient httpClient, ILogger<WhatsAppMessageSender> logger, IServiceScopeFactory scopeFactory)
    {
        _httpClient = httpClient;
        _logger = logger;
        _scopeFactory = scopeFactory;
        _whatsappToken = Environment.GetEnvironmentVariable("WHATSAPP_ACCESS_TOKEN")?.Trim().Trim('"');
        _whatsappPhoneId = Environment.GetEnvironmentVariable("WHATSAPP_PHONE_NUMBER_ID")?.Trim().Trim('"');
    }

    public async Task SendWhatsAppMessageAsync(string to, string text, string? phoneNumberId = null, bool isAiResponse = false, Guid? contactoId = null, CancellationToken cancellationToken = default)
    {
        var phoneIdToUse = phoneNumberId ?? _whatsappPhoneId;
        
        if (string.IsNullOrEmpty(_whatsappToken) || string.IsNullOrEmpty(phoneIdToUse))
        {
            _logger.LogWarning("WhatsApp Message Sender: Credenciales no configuradas.");
            return;
        }

        var url = $"https://graph.facebook.com/v19.0/{phoneIdToUse}/messages";
        var payload = new
        {
            messaging_product = "whatsapp",
            to = to,
            type = "text",
            text = new { body = text }
        };

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _whatsappToken);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error enviando mensaje de WhatsApp a {Phone}: {Error}", to, error);
                response.EnsureSuccessStatusCode();
            }

            // Registrar en BD
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();

                var agente = await db.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == phoneIdToUse, cancellationToken);
                Guid? agenteId = agente?.Id;

                if (!contactoId.HasValue && agenteId.HasValue)
                {
                    var contacto = await db.Contactos.FirstOrDefaultAsync(c => c.Telefono == to && c.AgenteId == agenteId.Value, cancellationToken);
                    contactoId = contacto?.Id;
                }

                if (contactoId.HasValue)
                {
                    var messageLog = new WhatsappMessage
                    {
                        Id = Guid.NewGuid(),
                        ContactoId = contactoId.Value,
                        AgenteId = agenteId,
                        Telefono = to,
                        Rol = "assistant",
                        OrigenMensaje = isAiResponse ? "IA" : "AgenteHumano",
                        Contenido = text,
                        Fecha = DateTimeOffset.UtcNow
                    };

                    db.WhatsappMessages.Add(messageLog);
                    await db.SaveChangesAsync(cancellationToken);
                    if (contactoId.HasValue) await db.Contactos.Where(c => c.Id == contactoId.Value).ExecuteUpdateAsync(s => s.SetProperty(x => x.FechaUltimaActividad, DateTimeOffset.UtcNow), cancellationToken);

                    // Auto-completar escalación si el agente responde manualmente
                    if (!isAiResponse && contactoId.HasValue)
                    {
                        var self = this;
                        _ = Task.Run(async () => await self.AutoCompletarEscalacionAsync(contactoId.Value));
                    }
                }
                else
                {
                    _logger.LogWarning("WhatsAppMessageSender: No se pudo registrar el mensaje porque no se encontró el Contacto correspondiente al teléfono {Phone}.", to);
                }
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "WhatsAppMessageSender: Error guardando el registro del mensaje en BD.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando mensaje de WhatsApp a {Phone}", to);
            throw;
        }
    }

    public async Task SendImageMessageAsync(string to, string imageUrl, string caption, string? phoneNumberId = null, bool isAiResponse = false, Guid? contactoId = null, CancellationToken cancellationToken = default)
    {
        var phoneIdToUse = phoneNumberId ?? _whatsappPhoneId;
        
        if (string.IsNullOrEmpty(_whatsappToken) || string.IsNullOrEmpty(phoneIdToUse))
        {
            _logger.LogWarning("WhatsApp Message Sender: Credenciales no configuradas.");
            return;
        }

        var url = $"https://graph.facebook.com/v19.0/{phoneIdToUse}/messages";
        var payload = new
        {
            messaging_product = "whatsapp",
            to = to,
            type = "image",
            image = new { link = imageUrl, caption = caption }
        };

        try
        {
            var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _whatsappToken);
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

            var response = await _httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError("Error enviando imagen de WhatsApp a {Phone}: {Error}", to, error);
                response.EnsureSuccessStatusCode();
            }

            // Registrar en BD
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();

                var agente = await db.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == phoneIdToUse, cancellationToken);
                Guid? agenteId = agente?.Id;

                if (!contactoId.HasValue && agenteId.HasValue)
                {
                    var contacto = await db.Contactos.FirstOrDefaultAsync(c => c.Telefono == to && c.AgenteId == agenteId.Value, cancellationToken);
                    contactoId = contacto?.Id;
                }

                if (contactoId.HasValue)
                {
                    var messageLog = new WhatsappMessage
                    {
                        Id = Guid.NewGuid(),
                        ContactoId = contactoId.Value,
                        AgenteId = agenteId,
                        Telefono = to,
                        Rol = "assistant",
                        OrigenMensaje = isAiResponse ? "IA" : "AgenteHumano",
                        Contenido = $"[Imagen] {caption}\nURL: {imageUrl}",
                        Fecha = DateTimeOffset.UtcNow
                    };

                    db.WhatsappMessages.Add(messageLog);
                    await db.SaveChangesAsync(cancellationToken);
                    if (contactoId.HasValue) await db.Contactos.Where(c => c.Id == contactoId.Value).ExecuteUpdateAsync(s => s.SetProperty(x => x.FechaUltimaActividad, DateTimeOffset.UtcNow), cancellationToken);

                    if (!isAiResponse && contactoId.HasValue)
                    {
                        var self = this;
                        _ = Task.Run(async () => await self.AutoCompletarEscalacionAsync(contactoId.Value));
                    }
                }
            }
            catch (Exception dbEx)
            {
                _logger.LogError(dbEx, "WhatsAppMessageSender: Error guardando el registro de la imagen en BD.");
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando imagen de WhatsApp a {Phone}", to);
            throw;
        }
    }

    private async Task AutoCompletarEscalacionAsync(Guid contactoId)
    {
        try
        {
            await using var scope = _scopeFactory.CreateAsyncScope();
            var ctx = scope.ServiceProvider.GetRequiredService<CrmDbContext>();

            var contacto = await ctx.Contactos
                .Where(c => c.Id == contactoId)
                .Select(c => new { c.Id, c.PendingEscalamientoJobId, c.PendingEscalamientoTareaId })
                .FirstOrDefaultAsync();

            if (contacto?.PendingEscalamientoJobId is null) return;

            // Cancelar el timer antes de que dispare al cliente
            BackgroundJob.Delete(contacto.PendingEscalamientoJobId);

            if (contacto.PendingEscalamientoTareaId.HasValue)
            {
                var tarea = await ctx.Tasks.FindAsync(contacto.PendingEscalamientoTareaId.Value);
                if (tarea is { Estado: "Pendiente" })
                {
                    tarea.Estado = "Completada";
                }
            }

            await ctx.Contactos
                .Where(c => c.Id == contactoId)
                .ExecuteUpdateAsync(s => s
                    .SetProperty(c => c.PendingEscalamientoJobId, (string?)null)
                    .SetProperty(c => c.PendingEscalamientoTareaId, (Guid?)null));

            await ctx.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "WhatsAppMessageSender: Error en auto-complete de escalación para contacto {Id}.", contactoId);
        }
    }
}
