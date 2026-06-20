using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Domain.Entities;
using Hangfire;

namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

public sealed class FacebookMessageSender : IFacebookMessageSender
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<FacebookMessageSender> _logger;
    private readonly IServiceScopeFactory _scopeFactory;

    public FacebookMessageSender(HttpClient httpClient, ILogger<FacebookMessageSender> logger, IServiceScopeFactory scopeFactory)
    {
        _httpClient = httpClient;
        _logger = logger;
        _scopeFactory = scopeFactory;
    }

    public async Task SendTextMessageAsync(string recipientPsid, string text, string? pageAccessToken = null, bool isAiResponse = false, Guid? contactoId = null, Guid? agenteId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(pageAccessToken))
        {
            _logger.LogWarning("FacebookMessageSender: pageAccessToken vacío. No se puede enviar mensaje a PSID {Psid}.", recipientPsid);
            return;
        }

        // El access_token va como query param, no como header — requerimiento de la API de Messenger
        var url = $"https://graph.facebook.com/v21.0/me/messages?access_token={pageAccessToken}";
        var payload = new
        {
            recipient = new { id = recipientPsid },
            message = new { text = text }
        };

        try
        {
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Error enviando mensaje de Facebook a PSID {Psid}: {Error}", recipientPsid, error);
                response.EnsureSuccessStatusCode();
            }

            // Registrar en BD
            if (contactoId.HasValue && agenteId.HasValue)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();

                    var messageLog = new FacebookMessage
                    {
                        Id = Guid.NewGuid(),
                        ContactoId = contactoId.Value,
                        FacebookSenderId = recipientPsid,
                        AgenteId = agenteId.Value,
                        Rol = "assistant",
                        OrigenMensaje = isAiResponse ? "IA" : "AgenteHumano",
                        Contenido = text,
                        Fecha = DateTimeOffset.UtcNow
                    };

                    db.FacebookMessages.Add(messageLog);
                    await db.SaveChangesAsync(cancellationToken);
                    if (contactoId.HasValue) await db.Contactos.Where(c => c.Id == contactoId.Value).ExecuteUpdateAsync(s => s.SetProperty(x => x.FechaUltimaActividad, DateTimeOffset.UtcNow), cancellationToken);

                    // Auto-completar escalación si el agente responde manualmente
                    if (!isAiResponse)
                    {
                        var self = this;
                        _ = Task.Run(async () => await self.AutoCompletarEscalacionAsync(contactoId.Value));
                    }
                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "FacebookMessageSender: Error guardando el registro del mensaje en BD.");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando mensaje de Facebook a PSID {Psid}", recipientPsid);
            throw;
        }
    }

    public async Task SendImageMessageAsync(string recipientPsid, string imageUrl, string? pageAccessToken = null, bool isAiResponse = false, Guid? contactoId = null, Guid? agenteId = null, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrEmpty(pageAccessToken))
        {
            _logger.LogWarning("FacebookMessageSender: pageAccessToken vacío. No se puede enviar imagen a PSID {Psid}.", recipientPsid);
            return;
        }

        var url = $"https://graph.facebook.com/v21.0/me/messages?access_token={pageAccessToken}";
        var payload = new
        {
            recipient = new { id = recipientPsid },
            message = new
            {
                attachment = new
                {
                    type = "image",
                    payload = new { url = imageUrl, is_reusable = true }
                }
            }
        };

        try
        {
            var content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(url, content, cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync(cancellationToken);
                _logger.LogError("Error enviando imagen de Facebook a PSID {Psid}: {Error}", recipientPsid, error);
                response.EnsureSuccessStatusCode();
            }

            // Registrar en BD
            if (contactoId.HasValue && agenteId.HasValue)
            {
                try
                {
                    using var scope = _scopeFactory.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<CrmDbContext>();

                    var messageLog = new FacebookMessage
                    {
                        Id = Guid.NewGuid(),
                        ContactoId = contactoId.Value,
                        FacebookSenderId = recipientPsid,
                        AgenteId = agenteId.Value,
                        Rol = "assistant",
                        OrigenMensaje = isAiResponse ? "IA" : "AgenteHumano",
                        Contenido = $"[Imagen]\nURL: {imageUrl}",
                        Fecha = DateTimeOffset.UtcNow
                    };

                    db.FacebookMessages.Add(messageLog);
                    await db.SaveChangesAsync(cancellationToken);
                    if (contactoId.HasValue) await db.Contactos.Where(c => c.Id == contactoId.Value).ExecuteUpdateAsync(s => s.SetProperty(x => x.FechaUltimaActividad, DateTimeOffset.UtcNow), cancellationToken);

                    // Auto-completar escalación si el agente responde manualmente
                    if (!isAiResponse)
                    {
                        var self = this;
                        _ = Task.Run(async () => await self.AutoCompletarEscalacionAsync(contactoId.Value));
                    }
                }
                catch (Exception dbEx)
                {
                    _logger.LogError(dbEx, "FacebookMessageSender: Error guardando el registro de la imagen en BD.");
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Excepción enviando imagen de Facebook a PSID {Psid}", recipientPsid);
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
            _logger.LogError(ex, "FacebookMessageSender: Error en auto-complete de escalación para contacto {Id}.", contactoId);
        }
    }
}
