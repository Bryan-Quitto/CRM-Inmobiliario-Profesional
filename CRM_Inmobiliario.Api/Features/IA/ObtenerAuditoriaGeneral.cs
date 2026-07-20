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
    public static void MapObtenerAuditoriaGeneral(this IEndpointRouteBuilder app)
    {
        app.MapGet("/ia/auditoria-general", [Microsoft.AspNetCore.Authorization.Authorize] async (
            [Microsoft.AspNetCore.Mvc.FromQuery] int? dias,
            [Microsoft.AspNetCore.Mvc.FromQuery] DateTime? startDate,
            [Microsoft.AspNetCore.Mvc.FromQuery] DateTime? endDate,
            [Microsoft.AspNetCore.Mvc.FromQuery] string? canal,
            ClaimsPrincipal user,
            CrmDbContext context,
            CRM_Inmobiliario.Api.Infrastructure.Security.IEncryptionService encryptionService, 
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



            var agenteIdStr = user.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!Guid.TryParse(agenteIdStr, out var agenteId))
                return Results.Unauthorized();

            var dbCanal = canal == "Personal" ? "Copilot" : canal;

            try
            {
                var connection = context.Database.GetDbConnection();

                var sql = ObtenerAuditoriaGeneralQueryBuilder.BuildQuery(dbCanal, canal);
#pragma warning disable DAP005
                var events = await connection.QueryAsync<AuditoriaEventRow>(sql, new { StartDate = queryStartDate, EndDate = queryEndDate, Canal = dbCanal, AgenteId = agenteId, AgenteIdStr = agenteIdStr });
#pragma warning restore DAP005

                foreach (var ev in events)
                {
                    if (!string.IsNullOrEmpty(ev.DetalleJson))
                        ev.DetalleJson = encryptionService.Decrypt(ev.DetalleJson);
                    if (!string.IsNullOrEmpty(ev.TriggerMessage))
                        ev.TriggerMessage = encryptionService.Decrypt(ev.TriggerMessage);
                }

                var sessions = ObtenerAuditoriaGeneralProcessor.AgruparEventos(events);

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
    }}
