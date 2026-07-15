using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ObtenerHistorialAlmacenamiento
{
    public record FileLogDto(
        Guid Id,
        string ObjectKey,
        long FileSizeBytes,
        string TargetType,
        string? TargetId,
        string? TargetName,
        string? Context,
        DateTimeOffset UploadedAt,
        bool IsDeleted,
        DateTimeOffset? DeletedAt
    );

    public static IEndpointRouteBuilder MapObtenerHistorialAlmacenamientoEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/configuracion/almacenamiento/historial", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();

            var dbLogs = await context.AgentStorageFileLogs
                .AsNoTracking()
                .Where(l => l.AgentId == agenteId)
                .OrderByDescending(l => l.UploadedAt)
                .ToListAsync();

            var propIds = dbLogs.Where(l => l.TargetType == "Propiedad" && Guid.TryParse(l.TargetId, out _))
                .Select(l => Guid.Parse(l.TargetId!)).Distinct().ToList();
                
            var contactIds = dbLogs.Where(l => l.TargetType == "WhatsApp" && Guid.TryParse(l.TargetId, out _))
                .Select(l => Guid.Parse(l.TargetId!)).Distinct().ToList();

            var properties = await context.Properties.AsNoTracking()
                .Where(p => propIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => p.Titulo);

            var contacts = await context.Contactos.AsNoTracking()
                .Where(c => contactIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => $"{c.Nombre} {c.Apellido} ({c.Telefono})".Trim());

            var logs = dbLogs.Select(l => 
            {
                string? targetName = null;
                if (l.TargetType == "Propiedad" && Guid.TryParse(l.TargetId, out var pId) && properties.TryGetValue(pId, out var pName))
                {
                    targetName = pName;
                }
                else if (l.TargetType == "WhatsApp" && Guid.TryParse(l.TargetId, out var cId) && contacts.TryGetValue(cId, out var cName))
                {
                    targetName = cName;
                }

                return new FileLogDto(
                    l.Id,
                    l.ObjectKey,
                    l.FileSizeBytes,
                    l.TargetType,
                    l.TargetId,
                    targetName,
                    l.Context,
                    l.UploadedAt,
                    l.IsDeleted,
                    l.DeletedAt
                );
            }).ToList();

            return Results.Ok(logs);
        })
        .WithTags("Configuracion")
        .WithName("ObtenerHistorialAlmacenamiento");

        return endpoints;
    }
}
