using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;

namespace CRM_Inmobiliario.Api.Features.Contactos;

public static class ObtenerTokenUsageContactoFeature
{
    public record TokenUsageResponse(int TotalTokens, int InputTokens, int CachedTokens, int OutputTokens, decimal CostoUSD, decimal AhorroUSD);

    public static void MapObtenerTokenUsageContactoEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapGet("/contactos/{id:guid}/token-usage", async (
            Guid id, 
            string? rango,
            string? channel,
            ClaimsPrincipal user, 
            CrmDbContext context, 
            Microsoft.Extensions.Logging.ILoggerFactory loggerFactory,
            CancellationToken ct) =>
        {
            var logger = loggerFactory.CreateLogger("TokenUsageEndpoint");
            var agenteId = user.GetRequiredUserId();
            var limitDate = DateTimeOffset.MinValue;
            var now = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));

            rango = rango?.ToLower() ?? "hoy";
            channel = channel?.ToLower() ?? "todas";
            logger.LogInformation("=========================================");
            logger.LogInformation("Iniciando petición TokenUsage para ContactoId={Id}, AgenteId={AgenteId}, Rango={Rango}, Channel={Channel}", id, agenteId, rango, channel);

            if (rango == "hoy")
            {
                limitDate = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.FromHours(-5));
            }
            else if (rango == "semana")
            {
                int diff = (7 + (now.DayOfWeek - DayOfWeek.Monday)) % 7;
                var startOfWeek = now.AddDays(-1 * diff).Date;
                limitDate = new DateTimeOffset(startOfWeek, TimeSpan.FromHours(-5));
            }
            else if (rango == "mes")
            {
                limitDate = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.FromHours(-5));
            }
            else // siempre
            {
                limitDate = DateTimeOffset.MinValue;
            }

            logger.LogInformation("LimitDate calculado: {LimitDate}", limitDate);

            // LOG DB RAW DATA (For debugging)
            var allTokens = await context.Set<CRM_Inmobiliario.Api.Domain.Entities.ContactDailyTokenUsage>()
                .Where(u => u.ContactoId == id)
                .Select(u => new { u.Date, u.TokensUsed, u.InputTokens, u.CachedTokens, u.OutputTokens, u.CostoUSD, u.AhorroUSD })
                .ToListAsync(ct);
            logger.LogInformation("Tokens brutos en DB para contacto {Id}: {Count} registros", id, allTokens.Count);
            foreach(var t in allTokens) 
            {
                logger.LogInformation(" - DB Registro: Date={Date} (UTC: {IsUtc}), Total={Total}, Input={In}, Cached={Cached}, Output={Out}, CostoUSD={Costo}, AhorroUSD={Ahorro}", 
                    t.Date, t.Date.Offset, t.TokensUsed, t.InputTokens, t.CachedTokens, t.OutputTokens, t.CostoUSD, t.AhorroUSD);
            }

            string? dbChannel = channel == "facebook" ? "Facebook" : (channel == "whatsapp" ? "WhatsApp" : null);

            var queryResult = await context.Contactos
                .Where(c => c.Id == id && (c.AgenteId == agenteId || c.CompartidoCon.Any(ac => ac.AgenteId == agenteId)))
                .Select(c => new
                {
                    TotalTokens = context.Set<CRM_Inmobiliario.Api.Domain.Entities.ContactDailyTokenUsage>()
                        .Where(u => u.ContactoId == id && u.Date >= limitDate && (dbChannel == null || u.Channel == dbChannel))
                        .Sum(u => (int?)u.TokensUsed) ?? 0,
                    InputTokens = context.Set<CRM_Inmobiliario.Api.Domain.Entities.ContactDailyTokenUsage>()
                        .Where(u => u.ContactoId == id && u.Date >= limitDate && (dbChannel == null || u.Channel == dbChannel))
                        .Sum(u => (int?)u.InputTokens) ?? 0,
                    CachedTokens = context.Set<CRM_Inmobiliario.Api.Domain.Entities.ContactDailyTokenUsage>()
                        .Where(u => u.ContactoId == id && u.Date >= limitDate && (dbChannel == null || u.Channel == dbChannel))
                        .Sum(u => (int?)u.CachedTokens) ?? 0,
                    OutputTokens = context.Set<CRM_Inmobiliario.Api.Domain.Entities.ContactDailyTokenUsage>()
                        .Where(u => u.ContactoId == id && u.Date >= limitDate && (dbChannel == null || u.Channel == dbChannel))
                        .Sum(u => (int?)u.OutputTokens) ?? 0,
                    CostoUSD = context.Set<CRM_Inmobiliario.Api.Domain.Entities.ContactDailyTokenUsage>()
                        .Where(u => u.ContactoId == id && u.Date >= limitDate && (dbChannel == null || u.Channel == dbChannel))
                        .Sum(u => (decimal?)u.CostoUSD) ?? 0m,
                    AhorroUSD = context.Set<CRM_Inmobiliario.Api.Domain.Entities.ContactDailyTokenUsage>()
                        .Where(u => u.ContactoId == id && u.Date >= limitDate && (dbChannel == null || u.Channel == dbChannel))
                        .Sum(u => (decimal?)u.AhorroUSD) ?? 0m
                })
                .FirstOrDefaultAsync(ct);

            if (queryResult == null) 
            {
                logger.LogWarning("El contacto {Id} no fue encontrado o el agente {AgenteId} no tiene acceso.", id, agenteId);
                return Results.NotFound();
            }

            var totalTokens = queryResult.TotalTokens;
            var inputTokens = queryResult.InputTokens;
            var cachedTokens = queryResult.CachedTokens;
            var outputTokens = queryResult.OutputTokens;
            var costoUsd = queryResult.CostoUSD;
            var ahorroUsd = queryResult.AhorroUSD;
            
            logger.LogInformation("Query exitosa. TotalTokens={Tokens}, Input={Input}, Cached={Cached}, Output={Output}, CostoUSD={Costo}, AhorroUSD={Ahorro}", 
                totalTokens, inputTokens, cachedTokens, outputTokens, costoUsd, ahorroUsd);

            return Results.Ok(new TokenUsageResponse(totalTokens, inputTokens, cachedTokens, outputTokens, costoUsd, ahorroUsd));
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("ObtenerTokenUsageContacto");
    }
}
