using System;
using System.Collections.Concurrent;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Linq;
namespace CRM_Inmobiliario.Api.Infrastructure.Security;

public sealed class SecurityTelemetryFilter : IEndpointFilter
{
    private const int MaxViewsPerWindow = 10;
    private static readonly TimeSpan WindowDuration = TimeSpan.FromMinutes(5);

    public async ValueTask<object?> InvokeAsync(EndpointFilterInvocationContext context, EndpointFilterDelegate next)
    {
        var httpContext = context.HttpContext;
        
        var user = httpContext.User;
        if (user?.Identity?.IsAuthenticated != true)
        {
            return await next(context);
        }

        var agenteIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(agenteIdClaim) || !Guid.TryParse(agenteIdClaim, out var agenteId))
        {
            return await next(context);
        }

        bool isAdmin = false;
        var appMetadata = user.FindFirst("app_metadata")?.Value;
        if (!string.IsNullOrEmpty(appMetadata))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(appMetadata);
                isAdmin = doc.RootElement.TryGetProperty("role", out var roleElement) && roleElement.GetString() == "Admin";
            }
            catch { }
        }

        // Si es administrador, no lo rastreamos
        if (isAdmin)
        {
            return await next(context);
        }

        Guid? entityId = null;
        foreach (var argument in context.Arguments)
        {
            if (argument is Guid guidValue)
            {
                entityId = guidValue;
                break;
            }
        }

        if (!entityId.HasValue)
        {
            return await next(context);
        }

        var cache = httpContext.RequestServices.GetRequiredService<IMemoryCache>();
        var cacheKey = $"Telemetry_Views_{agenteId}";

        var viewedIds = cache.GetOrCreate(cacheKey, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = WindowDuration;
            return new ConcurrentDictionary<Guid, byte>();
        });

        if (viewedIds != null)
        {
            if (viewedIds.TryAdd(entityId.Value, 0))
            {
                if (viewedIds.Count > MaxViewsPerWindow)
                {
                    var logger = httpContext.RequestServices.GetRequiredService<ILogger<SecurityTelemetryFilter>>();
                    logger.LogWarning("Actividad anómala detectada para el agente {AgenteId}. Visitas: {Count}", agenteId, viewedIds.Count);

                    var dbContext = httpContext.RequestServices.GetRequiredService<CrmDbContext>();
                    
                    var auditLog = new SecurityAuditLog
                    {
                        Id = Guid.NewGuid(),
                        AgenteId = agenteId,
                        TipoIncidente = "Posible Robo Manual",
                        Descripcion = $"Visitó más de {MaxViewsPerWindow} registros distintos en {WindowDuration.TotalMinutes} minutos.",
                        Timestamp = DateTimeOffset.UtcNow
                    };

                    dbContext.SecurityAuditLogs.Add(auditLog);

                    var adminAgent = await dbContext.Agents.FirstOrDefaultAsync(a => a.Rol == "Admin");
                    if (adminAgent != null)
                    {
                        // Insertar Tarea Urgente para el Admin (Campana)
                        var task = new TaskItem
                        {
                            Id = Guid.NewGuid(),
                            AgenteId = adminAgent.Id,
                            Titulo = "ALERTA: Actividad Anómala (Posible Robo)",
                            Descripcion = $"El agente con UUID {agenteId} visitó {viewedIds.Count} registros distintos rápidamente.",
                            TipoTarea = "Alerta de Seguridad",
                            Estado = "Pendiente",
                            FechaInicio = DateTimeOffset.UtcNow,
                            DuracionMinutos = 15,
                            ColorHex = "#ef4444" // Rojo Tailwind
                        };

                        dbContext.Tasks.Add(task);
                    }
                    await dbContext.SaveChangesAsync();

                    // Limpiar la caché para evitar flood continuo en la DB por este agente
                    cache.Remove(cacheKey);
                }
            }
        }

        return await next(context);
    }
}
