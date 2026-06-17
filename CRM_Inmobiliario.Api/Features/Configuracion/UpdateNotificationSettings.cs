using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class UpdateNotificationSettings
{
    public static void MapUpdateNotificationSettingsEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/agents/{id}/notifications", async (Guid id, CrmDbContext dbContext, ClaimsPrincipal user) =>
        {
            var userIdString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid currentUserId)) return Results.Unauthorized();

            var role = user.FindFirst(ClaimTypes.Role)?.Value ?? user.FindFirst("Rol")?.Value;
            
            var agent = await dbContext.Agents.FindAsync(id);
            if (agent == null) return Results.NotFound(new { error = "Agent not found" });

            if (currentUserId != id && role != "Admin")
            {
                return Results.Forbid();
            }

            return Results.Ok(new
            {
                NotifyOverdueTasksIntervalMinutes = agent.NotifyOverdueTasksIntervalMinutes > 0 ? agent.NotifyOverdueTasksIntervalMinutes : 60,
                NotifyTodayTasksAdvanceMinutes = agent.NotifyTodayTasksAdvanceMinutes > 0 ? agent.NotifyTodayTasksAdvanceMinutes : 300,
                NotifyTodayTasksIntervalMinutes = agent.NotifyTodayTasksIntervalMinutes > 0 ? agent.NotifyTodayTasksIntervalMinutes : 60,
                NotifyAiHelpTasksIntervalMinutes = agent.NotifyAiHelpTasksIntervalMinutes > 0 ? agent.NotifyAiHelpTasksIntervalMinutes : 1,
                NotifyAiHelpTasksMaxRetries = agent.NotifyAiHelpTasksMaxRetries > 0 ? agent.NotifyAiHelpTasksMaxRetries : 3,
                NotifyOverdueTasksMaxHours = agent.NotifyOverdueTasksMaxHours > 0 ? agent.NotifyOverdueTasksMaxHours : 24
            });
        })
        .WithName("GetNotificationSettings")
        .WithTags("Configuracion")
        .RequireAuthorization();

        endpoints.MapPut("/agents/{id}/notifications", async (
            Guid id,
            [FromBody] UpdateNotificationSettingsRequest request,
            ClaimsPrincipal user,
            CrmDbContext dbContext) =>
        {
            var userIdString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!Guid.TryParse(userIdString, out Guid currentUserId))
            {
                return Results.Unauthorized();
            }

            var role = user.FindFirst(ClaimTypes.Role)?.Value ?? user.FindFirst("Rol")?.Value;

            var agent = await dbContext.Agents.FindAsync(id);
            if (agent == null)
            {
                return Results.NotFound(new { error = "Agent not found" });
            }

            if (currentUserId != id && role != "Admin")
            {
                return Results.Forbid();
            }

            // Validar valores
            if (request.NotifyAiHelpTasksMaxRetries < 1 || request.NotifyAiHelpTasksMaxRetries > 5)
            {
                return Results.BadRequest(new { error = "Los reintentos de IA deben estar entre 1 y 5." });
            }

            if (request.NotifyOverdueTasksIntervalMinutes < 1 || request.NotifyOverdueTasksIntervalMinutes > 10080 ||
                request.NotifyTodayTasksAdvanceMinutes < 1 || request.NotifyTodayTasksAdvanceMinutes > 10080 ||
                request.NotifyTodayTasksIntervalMinutes < 1 || request.NotifyTodayTasksIntervalMinutes > 10080 ||
                request.NotifyAiHelpTasksIntervalMinutes < 1 || request.NotifyAiHelpTasksIntervalMinutes > 10080)
            {
                return Results.BadRequest(new { error = "Las frecuencias y tiempos de anticipación deben estar entre 1 minuto y 7 días (10080 minutos)." });
            }

            if (request.NotifyOverdueTasksMaxHours < 1 || request.NotifyOverdueTasksMaxHours > 72)
            {
                return Results.BadRequest(new { error = "El límite de tareas atrasadas debe estar entre 1 y 72 horas." });
            }

            // Actualizar campos
            agent.NotifyOverdueTasksIntervalMinutes = request.NotifyOverdueTasksIntervalMinutes;
            agent.NotifyTodayTasksAdvanceMinutes = request.NotifyTodayTasksAdvanceMinutes;
            agent.NotifyTodayTasksIntervalMinutes = request.NotifyTodayTasksIntervalMinutes;
            agent.NotifyAiHelpTasksIntervalMinutes = request.NotifyAiHelpTasksIntervalMinutes;
            agent.NotifyAiHelpTasksMaxRetries = request.NotifyAiHelpTasksMaxRetries;
            agent.NotifyOverdueTasksMaxHours = request.NotifyOverdueTasksMaxHours;

            await dbContext.SaveChangesAsync();

            return Results.Ok(new
            {
                agent.NotifyOverdueTasksIntervalMinutes,
                agent.NotifyTodayTasksAdvanceMinutes,
                agent.NotifyTodayTasksIntervalMinutes,
                agent.NotifyAiHelpTasksIntervalMinutes,
                agent.NotifyAiHelpTasksMaxRetries,
                agent.NotifyOverdueTasksMaxHours
            });
        })
        .WithName("UpdateNotificationSettings")
        .WithTags("Configuracion")
        .RequireAuthorization();
    }
}

public class UpdateNotificationSettingsRequest
{
    public int NotifyOverdueTasksIntervalMinutes { get; set; }
    public int NotifyTodayTasksAdvanceMinutes { get; set; }
    public int NotifyTodayTasksIntervalMinutes { get; set; }
    public int NotifyAiHelpTasksIntervalMinutes { get; set; }
    public int NotifyAiHelpTasksMaxRetries { get; set; }
    public int NotifyOverdueTasksMaxHours { get; set; }
}
