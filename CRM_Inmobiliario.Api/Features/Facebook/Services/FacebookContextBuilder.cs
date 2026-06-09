using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Facebook.Services;

/// <summary>
/// Prepara el contexto de conversación para un mensaje entrante de Facebook Messenger:
/// busca/crea el contacto por PSID, carga/crea la conversación, aplica reglas de handoff.
/// Extraído de FacebookAiService para cumplir el límite de 200 líneas por archivo.
/// </summary>
internal sealed class FacebookContextBuilder
{
    private readonly IDbContextFactory<CrmDbContext> _dbFactory;
    private readonly ILogger _logger;
    private readonly IHttpClientFactory _httpClientFactory;

    public FacebookContextBuilder(
        IDbContextFactory<CrmDbContext> dbFactory,
        ILogger logger,
        IHttpClientFactory httpClientFactory)
    {
        _dbFactory = dbFactory;
        _logger = logger;
        _httpClientFactory = httpClientFactory;
    }

    public record FacebookContext(
        Domain.Entities.Agent Agente,
        Contacto? Contacto,
        FacebookConversation Conversation,
        List<(string Role, string Content)> History,
        bool ShouldSilence);

    public async Task<FacebookContext?> PrepareAsync(string senderId, string pageId, CancellationToken ct)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(ct);

        var agente = await db.Agents.FirstOrDefaultAsync(a => a.FacebookPageId == pageId, ct);
        if (agente is null)
        {
            _logger.LogWarning("No hay agente configurado para la página de Facebook {PageId}.", pageId);
            return null;
        }

        if (!agente.IsFacebookAiEnabled)
        {
            _logger.LogInformation("Facebook AI desactivado para el agente {AgentId}. Ignorando PSID {SenderId}.", agente.Id, senderId);
            return null;
        }

        // Buscar o crear contacto por PSID dentro del agente propietario
        var contacto = await db.Contactos.FirstOrDefaultAsync(
            c => c.FacebookSenderId == senderId && c.AgenteId == agente.Id, ct);

        if (contacto is null)
        {
            var fetcher = new FacebookProfileFetcher(_httpClientFactory, _logger);
            var profile = await fetcher.FetchAsync(senderId, agente.FacebookPageAccessToken ?? string.Empty);

            var nombre   = !string.IsNullOrWhiteSpace(profile.FirstName) ? profile.FirstName : "Cliente FB";
            var apellido = !string.IsNullOrWhiteSpace(profile.LastName)
                ? profile.LastName
                : $"FB-{senderId[^Math.Min(6, senderId.Length)..]}";

            _logger.LogInformation(
                "Nuevo contacto de Messenger: {Nombre} {Apellido} (PSID: {Psid}, fuente: {Source})",
                nombre, apellido, senderId,
                profile.FirstName != null ? "facebook_api" : "fallback");

            contacto = new Contacto
            {
                Id = Guid.NewGuid(),
                Nombre = nombre,
                Apellido = apellido,
                Telefono = senderId,
                FacebookSenderId = senderId,
                Origen = "IA Facebook",
                AgenteId = agente.Id,
                FechaCreacion = DateTimeOffset.UtcNow,
                EtapaEmbudo = "Nuevo",
                EsProspecto = true
            };
            db.Contactos.Add(contacto);
            await db.SaveChangesAsync(ct);
        }

        // Evaluar si el bot está activo para este contacto
        bool shouldSilence = !contacto.BotActivo;

        // Cargar o crear conversación por PSID + AgenteId
        var conversation = await db.FacebookConversations.FirstOrDefaultAsync(
            c => c.FacebookSenderId == senderId && c.AgenteId == agente.Id, ct);

        List<(string Role, string Content)> history;

        if (conversation is null)
        {
            history = new List<(string, string)>();
            conversation = new FacebookConversation
            {
                Id = Guid.NewGuid(),
                ContactoId = contacto.Id,
                FacebookSenderId = senderId,
                PageId = pageId,
                AgenteId = agente.Id,
                HistorialJson = "[]",
                UltimaActualizacion = DateTimeOffset.UtcNow
            };
            db.FacebookConversations.Add(conversation);
            await db.SaveChangesAsync(ct);
        }
        else
        {
            history = DeserializeHistory(conversation.HistorialJson);
        }

        return new FacebookContext(agente, contacto, conversation, history, shouldSilence);
    }

    public async Task SaveStateAsync(FacebookConversation conversation, List<(string Role, string Content)> history, CancellationToken ct)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(ct);
        var tracked = await db.FacebookConversations.FindAsync(new object[] { conversation.Id }, ct);
        if (tracked is null) return;

        tracked.HistorialJson = SerializeHistory(history);
        tracked.UltimaActualizacion = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public async Task LogMessageAsync(Guid agenteId, Guid? contactoId, string senderId, string role, string content, CancellationToken ct)
    {
        await using var db = await _dbFactory.CreateDbContextAsync(ct);
        db.FacebookMessages.Add(new FacebookMessage
        {
            Id = Guid.NewGuid(),
            ContactoId = contactoId,
            FacebookSenderId = senderId,
            AgenteId = agenteId,
            Rol = role,
            Contenido = content,
            Fecha = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync(ct);
    }

    private static List<(string Role, string Content)> DeserializeHistory(string json)
    {
        try
        {
            var raw = System.Text.Json.JsonSerializer.Deserialize<List<HistoryEntry>>(json) ?? new();
            return raw.Select(e => (e.Role, e.Content)).ToList();
        }
        catch { return new(); }
    }

    private static string SerializeHistory(List<(string Role, string Content)> history)
    {
        var entries = history.Select(h => new HistoryEntry { Role = h.Role, Content = h.Content }).ToList();
        return System.Text.Json.JsonSerializer.Serialize(entries);
    }

    private sealed class HistoryEntry
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
