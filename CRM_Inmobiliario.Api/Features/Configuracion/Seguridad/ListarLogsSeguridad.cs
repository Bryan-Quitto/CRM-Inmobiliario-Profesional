using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;

namespace CRM_Inmobiliario.Api.Features.Configuracion.Seguridad;

public static class ListarLogsSeguridadFeature
{
    public static RouteHandlerBuilder MapListarLogsSeguridadEndpoint(this IEndpointRouteBuilder endpoints)
    {
        return endpoints.MapGet("/configuracion/seguridad/logs", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(agenteIdClaim) || !Guid.TryParse(agenteIdClaim, out var requestAgenteId))
            {
                return Results.Unauthorized();
            }



            var logs = await context.SecurityAuditLogs
                .Include(x => x.Agente)
                .OrderByDescending(x => x.Timestamp)
                .Select(x => new 
                {
                    x.Id,
                    x.AgenteId,
                    AgenteNombre = x.Agente != null ? $"{x.Agente.Nombre} {x.Agente.Apellido}" : "Desconocido",
                    x.TipoIncidente,
                    x.Descripcion,
                    x.Timestamp
                })
                .Take(50) // Limite
                .ToListAsync();

            return Results.Ok(logs);
        })
        .RequireAuthorization("AdminPolicy")
        .WithTags("Configuracion")
        .WithName("ListarLogsSeguridad");
    }
}
