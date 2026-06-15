using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;

namespace CRM_Inmobiliario.Api.Features.FinOps.GetAgentTokenUsage;

public static class GetAgentTokenUsageEndpoint
{
    public static void MapGetAgentTokenUsageEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/finops/token-usage", async (CrmDbContext db, HttpContext context, string channel = "Copilot") =>
        {
            var userIdString = context.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid agentId))
                return Results.Unauthorized();

            // The One Trip Pattern: Direct projection and sorting in DB
            var query = db.AgentDailyTokenUsages
                .Where(t => t.AgentId == agentId && t.Channel == channel)
                .OrderByDescending(t => t.Date)
                .Select(t => new TokenUsageDto
                {
                    Fecha = t.Date.ToOffset(TimeSpan.FromHours(-5)).ToString("yyyy-MM-dd"), // Ecuador timezone
                    Modelo = "Agregado Diario", // AgentDailyTokenUsage no guarda modelo por fila, es un agregado.
                    TokensInput = t.InputTokens,
                    TokensOutput = t.OutputTokens,
                    CostoTotalUsd = t.CostoUSD
                });

            var result = await query.Take(90).ToListAsync(); // Máximo 90 días — el frontend no necesita más para el chart

            return Results.Ok(result);
        });
    }
}
