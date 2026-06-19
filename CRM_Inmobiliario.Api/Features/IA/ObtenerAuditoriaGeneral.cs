using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Dapper;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

using System.Security.Claims;

namespace CRM_Inmobiliario.Api.Features.IA;

public static class ObtenerAuditoriaGeneral
{
    public class AuditoriaEventRow
    {
        public Guid EventId { get; set; }
        public Guid? ContactoId { get; set; }
        public string? Telefono { get; set; }
        public string? ContactoNombre { get; set; }
        public string? ContactoApellido { get; set; }
        public DateTimeOffset Fecha { get; set; }
        public string Accion { get; set; } = string.Empty;
        public string? DetalleJson { get; set; }
        public string? TriggerMessage { get; set; }
        public string Source { get; set; } = string.Empty;
        public string Canal { get; set; } = string.Empty;
        public string? SenderType { get; set; }
    }

    public record AuditoriaSessionResponse(
        string SessionKey,
        long SessionId,
        Guid? ContactoId,
        string? Telefono,
        string? ContactoNombre,
        string? ContactoApellido,
        DateTimeOffset InicioSesion,
        DateTimeOffset FinSesion,
        string CanalPrincipal,
        List<AuditoriaEventRow> Eventos
    );

    public static void MapObtenerAuditoriaGeneral(this IEndpointRouteBuilder app)
    {
        app.MapGet("/ia/auditoria-general", [Microsoft.AspNetCore.Authorization.Authorize] async (
            [Microsoft.AspNetCore.Mvc.FromQuery] int? dias,
            [Microsoft.AspNetCore.Mvc.FromQuery] DateTime? startDate,
            [Microsoft.AspNetCore.Mvc.FromQuery] DateTime? endDate,
            [Microsoft.AspNetCore.Mvc.FromQuery] string? canal,
            ClaimsPrincipal user,
            CrmDbContext context, 
            ILogger<CrmDbContext> logger) =>
        {
            DateTimeOffset queryStartDate;
            DateTimeOffset queryEndDate;

            if (startDate.HasValue && endDate.HasValue)
            {
                queryStartDate = new DateTimeOffset(startDate.Value, TimeSpan.Zero);
                queryEndDate = new DateTimeOffset(endDate.Value, TimeSpan.Zero).AddDays(1).AddTicks(-1);
                if ((queryEndDate - queryStartDate).TotalDays > 32)
                {
                    queryStartDate = queryEndDate.AddDays(-31);
                }
            }
            else
            {
                var diasConsultados = dias ?? 7;
                if (diasConsultados <= 0) diasConsultados = 7;
                if (diasConsultados > 31) diasConsultados = 31;
                queryEndDate = DateTimeOffset.UtcNow;
                queryStartDate = queryEndDate.AddDays(-diasConsultados);
            }

            logger.LogInformation("--- OBTENIENDO AUDITORÍA GENERAL IA (Desde {Start} hasta {End}) ---", queryStartDate, queryEndDate);

            var agenteIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(agenteIdStr, out var agenteId))
                return Results.Unauthorized();

            var dbCanal = canal == "Personal" ? "Copilot" : canal;

            try
            {
                var connection = context.Database.GetDbConnection();

                var sql = @"
                WITH CombinedEvents AS (
                    SELECT 
                        l.""Id"" as ""EventId"",
                        l.""ContactoId"",
                        l.""TelefonoContacto"" as ""Telefono"",
                        COALESCE(c.""Nombre"", CASE WHEN l.""Canal"" = 'Copilot' OR l.""Canal"" = 'Personal' THEN 'Acción de Copiloto' ELSE NULL END) as ""ContactoNombre"",
                        c.""Apellido"" as ""ContactoApellido"",
                        l.""Fecha"",
                        l.""Accion"",
                        l.""DetalleJson"",
                        l.""TriggerMessage"",
                        'AiAction' as ""Source"",
                        l.""Canal"" as ""Canal"",
                        'IA' as ""SenderType""
                    FROM ""AiActionLogs"" l
                    LEFT JOIN ""Contactos"" c ON c.""Id"" = l.""ContactoId""
                    WHERE l.""Fecha"" >= @StartDate AND l.""Fecha"" <= @EndDate AND (c.""AgenteId"" = @AgenteId OR l.""TelefonoContacto"" = @AgenteIdStr)
                    " + (string.IsNullOrWhiteSpace(dbCanal) ? "" : @" AND (l.""Canal"" = @Canal OR (@Canal = 'Copilot' AND l.""Canal"" = 'Personal')) ") + @"

                    UNION ALL

                    SELECT 
                        w.""Id"" as ""EventId"",
                        w.""ContactoId"",
                        w.""Telefono"" as ""Telefono"",
                        c.""Nombre"" as ""ContactoNombre"",
                        c.""Apellido"" as ""ContactoApellido"",
                        w.""Fecha"",
                        'Message' as ""Accion"",
                        w.""Contenido"" as ""DetalleJson"",
                        NULL as ""TriggerMessage"",
                        'WhatsApp' as ""Source"",
                        'WhatsApp' as ""Canal"",
                        COALESCE(w.""OrigenMensaje"", w.""Rol"") as ""SenderType""
                    FROM ""WhatsappMessages"" w
                    LEFT JOIN ""Contactos"" c ON c.""Id"" = w.""ContactoId""
                    WHERE w.""Fecha"" >= @StartDate AND w.""Fecha"" <= @EndDate AND w.""AgenteId"" = @AgenteId
                    " + (!string.IsNullOrWhiteSpace(canal) && canal != "WhatsApp" ? " AND 1=0 " : "") + @"

                    UNION ALL

                    SELECT 
                        f.""Id"" as ""EventId"",
                        f.""ContactoId"",
                        f.""FacebookSenderId"" as ""Telefono"",
                        c.""Nombre"" as ""ContactoNombre"",
                        c.""Apellido"" as ""ContactoApellido"",
                        f.""Fecha"",
                        'Message' as ""Accion"",
                        f.""Contenido"" as ""DetalleJson"",
                        NULL as ""TriggerMessage"",
                        'Facebook' as ""Source"",
                        'Facebook' as ""Canal"",
                        COALESCE(f.""OrigenMensaje"", f.""Rol"") as ""SenderType""
                    FROM ""FacebookMessages"" f
                    LEFT JOIN ""Contactos"" c ON c.""Id"" = f.""ContactoId""
                    WHERE f.""Fecha"" >= @StartDate AND f.""Fecha"" <= @EndDate AND f.""AgenteId"" = @AgenteId
                    " + (!string.IsNullOrWhiteSpace(canal) && canal != "Facebook" ? " AND 1=0 " : "") + @"

                    UNION ALL

                    SELECT 
                        am.""Id"" as ""EventId"",
                        NULL as ""ContactoId"",
                        CAST(ac.""Id"" AS varchar) as ""Telefono"",
                        COALESCE(ac.""Title"", 'Conversación sin título') as ""ContactoNombre"",
                        NULL as ""ContactoApellido"",
                        am.""CreatedAt"" as ""Fecha"",
                        'Message' as ""Accion"",
                        am.""Content"" as ""DetalleJson"",
                        NULL as ""TriggerMessage"",
                        'Copilot' as ""Source"",
                        'Copilot' as ""Canal"",
                        am.""Role"" as ""SenderType""
                    FROM ""AgentMessages"" am
                    INNER JOIN ""AgentConversations"" ac ON ac.""Id"" = am.""AgentConversationId""
                    WHERE am.""CreatedAt"" >= @StartDate AND am.""CreatedAt"" <= @EndDate AND ac.""AgentId"" = @AgenteId
                    " + (!string.IsNullOrWhiteSpace(dbCanal) && dbCanal != "Copilot" ? " AND 1=0 " : "") + @"
                )
                SELECT 
                    ""EventId"", 
                    ""ContactoId"", 
                    ""Telefono"", 
                    ""ContactoNombre"",
                    ""ContactoApellido"",
                    ""Fecha"", 
                    ""Accion"", 
                    ""DetalleJson"", 
                    ""TriggerMessage"", 
                    ""Source"",
                    ""Canal"",
                    ""SenderType""
                FROM CombinedEvents
                ORDER BY ""Fecha"" ASC;";
#pragma warning disable DAP005
                var events = await connection.QueryAsync<AuditoriaEventRow>(sql, new { StartDate = queryStartDate, EndDate = queryEndDate, Canal = dbCanal, AgenteId = agenteId, AgenteIdStr = agenteIdStr });
#pragma warning restore DAP005

                var sessions = AgruparEventos(events);

                return Results.Ok(sessions);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error al obtener auditoría general");
                return Results.Problem("Error interno.");
            }
        })
        .WithName("ObtenerAuditoriaGeneral")
        .WithTags("IA")
        .RequireAuthorization()
        .CacheOutput(c => c.Expire(TimeSpan.FromSeconds(30)).SetVaryByQuery("dias", "canal").SetVaryByHeader("Authorization"));
    }

    public static List<AuditoriaSessionResponse> AgruparEventos(IEnumerable<AuditoriaEventRow> events)
    {
        var groupedByContact = events
            .GroupBy(e => e.ContactoId?.ToString() ?? e.Telefono ?? Guid.NewGuid().ToString());

        var sessions = new List<AuditoriaSessionResponse>();

        foreach (var group in groupedByContact)
        {
            var orderedEvents = group.OrderBy(x => x.Fecha).ToList();
            if (!orderedEvents.Any()) continue;

            long currentSessionId = 1;
            DateTimeOffset prevFecha = orderedEvents.First().Fecha;
            var currentSessionEvents = new List<AuditoriaEventRow>();

            foreach (var ev in orderedEvents)
            {
                if ((ev.Fecha - prevFecha).TotalMinutes > 10)
                {
                    if (currentSessionEvents.Any())
                    {
                        sessions.Add(CreateSessionResponse(group.Key, currentSessionId, currentSessionEvents.ToList()));
                        currentSessionId++;
                        currentSessionEvents.Clear();
                    }
                }
                
                currentSessionEvents.Add(ev);
                prevFecha = ev.Fecha;
            }

            if (currentSessionEvents.Any())
            {
                sessions.Add(CreateSessionResponse(group.Key, currentSessionId, currentSessionEvents.ToList()));
            }
        }

        return sessions.OrderByDescending(s => s.FinSesion).ToList();
    }

    private static AuditoriaSessionResponse CreateSessionResponse(string key, long sessionId, List<AuditoriaEventRow> events)
    {
        var first = events.First();
        return new AuditoriaSessionResponse(
            key,
            sessionId,
            first.ContactoId,
            first.Telefono,
            first.ContactoNombre,
            first.ContactoApellido,
            events.Min(x => x.Fecha),
            events.Max(x => x.Fecha),
            first.Canal ?? first.Source,
            events
        );
    }
}
