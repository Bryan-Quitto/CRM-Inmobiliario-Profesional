using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using static CRM_Inmobiliario.Api.Features.Configuracion.ObtenerHistorialAlmacenamiento;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ObtenerHistorialGlobalAlmacenamiento
{
    public record PaginatedResponse(
        List<FileLogDto> Items,
        int TotalCount
    );

    public static IEndpointRouteBuilder MapObtenerHistorialGlobalAlmacenamientoEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/configuracion/almacenamiento/historial-global", async (
            ClaimsPrincipal user, 
            CrmDbContext context, 
            int limit = 50, 
            int offset = 0,
            string? search = null,
            string? targetType = null,
            string? status = null,
            DateTimeOffset? startDate = null, 
            DateTimeOffset? endDate = null,
            string? sortBy = "uploadedAt",
            string? sortOrder = "desc") =>
        {
            var agenteId = user.GetRequiredUserId();

            var query = context.AgentStorageFileLogs
                .AsNoTracking()
                .Where(l => l.AgentId == agenteId);

            if (startDate.HasValue)
            {
                query = query.Where(l => l.UploadedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(l => l.UploadedAt <= endDate.Value);
            }

            if (!string.IsNullOrEmpty(targetType) && targetType != "Todas")
            {
                query = query.Where(l => l.TargetType == targetType);
            }

            var dbLogs = await query.ToListAsync();

            var propIds = dbLogs.Where(l => l.TargetType == "Propiedad" && Guid.TryParse(l.TargetId, out _))
                .Select(l => Guid.Parse(l.TargetId!)).Distinct().ToList();
                
            var contactIds = dbLogs.Where(l => l.TargetType == "WhatsApp" && Guid.TryParse(l.TargetId, out _))
                .Select(l => Guid.Parse(l.TargetId!)).Distinct().ToList();

            var properties = await context.Properties.AsNoTracking()
                .Where(p => propIds.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id, p => new { p.Titulo, p.FechaActualizacion });

            var contacts = await context.Contactos.AsNoTracking()
                .Where(c => contactIds.Contains(c.Id))
                .ToDictionaryAsync(c => c.Id, c => $"{c.Nombre} {c.Apellido} ({c.Telefono})".Trim());

            var dtos = dbLogs.Select(l => 
            {
                string? targetName = null;
                bool isDeleted = l.IsDeleted;
                DateTimeOffset? deletedAt = l.DeletedAt;

                if (l.TargetType == "Propiedad" && Guid.TryParse(l.TargetId, out var pId) && properties.TryGetValue(pId, out var prop))
                {
                    targetName = prop.Titulo;

                    // Marcar PDF como eliminado virtualmente si la propiedad fue editada después de que se generó
                    if (!isDeleted && l.Context == "PDF Ficha Comercial" && prop.FechaActualizacion > l.UploadedAt)
                    {
                        isDeleted = true;
                        deletedAt = prop.FechaActualizacion;
                    }
                }
                else if (l.TargetType == "WhatsApp" && Guid.TryParse(l.TargetId, out var cId) && contacts.TryGetValue(cId, out var cName))
                {
                    targetName = cName;
                }

                string friendlyName = l.ObjectKey.Split('/').LastOrDefault() ?? l.ObjectKey;

                if (l.TargetType == "Propiedad" && !string.IsNullOrEmpty(targetName))
                {
                    if (l.Context == "PDF Ficha Comercial")
                        friendlyName = $"{targetName} - Ficha Comercial.pdf";
                    else
                        friendlyName = $"{targetName}{(string.IsNullOrEmpty(l.Context) ? "" : $" - {l.Context}")}.webp";
                }
                else if (l.TargetType == "WhatsApp" && !string.IsNullOrEmpty(targetName))
                {
                    friendlyName = $"{targetName} - Audio WhatsApp ({l.UploadedAt.ToOffset(TimeSpan.FromHours(-5)).ToString("HH:mm")}).ogg";
                }
                else if (l.TargetType == "Agencia")
                {
                    friendlyName = "Logo de Agencia.webp";
                }
                else if (l.TargetType == "Perfil")
                {
                    friendlyName = "Foto de Perfil.webp";
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
                    isDeleted,
                    deletedAt,
                    friendlyName
                );
            }).ToList();

            // Agregar contador a los nombres duplicados para que sean únicos
            var nameGroups = dtos.GroupBy(l => l.FriendlyName).Where(g => g.Count() > 1);
            foreach (var group in nameGroups)
            {
                int counter = 1;
                foreach (var log in group.OrderBy(l => l.UploadedAt))
                {
                    var extensionIndex = log.FriendlyName.LastIndexOf('.');
                    string newName;
                    if (extensionIndex >= 0)
                    {
                        var nameWithoutExt = log.FriendlyName.Substring(0, extensionIndex);
                        var ext = log.FriendlyName.Substring(extensionIndex);
                        newName = $"{nameWithoutExt} {counter}{ext}";
                    }
                    else
                    {
                        newName = $"{log.FriendlyName} {counter}";
                    }
                    
                    var index = dtos.IndexOf(log);
                    dtos[index] = log with { FriendlyName = newName };
                    
                    counter++;
                }
            }

            IEnumerable<FileLogDto> logs = dtos;

            // 1. Search in memory against FriendlyName
            if (!string.IsNullOrEmpty(search))
            {
                var lowerSearch = search.ToLowerInvariant();
                logs = logs.Where(l => l.FriendlyName.ToLowerInvariant().Contains(lowerSearch) || 
                                       (l.TargetName != null && l.TargetName.ToLowerInvariant().Contains(lowerSearch)));
            }

            // 2. Status in memory filter
            if (!string.IsNullOrEmpty(status) && status != "Todos")
            {
                if (status == "Activos")
                    logs = logs.Where(l => !l.IsDeleted);
                else if (status == "Eliminados")
                    logs = logs.Where(l => l.IsDeleted);
            }

            // 3. Sort in memory
            var isAsc = sortOrder == "asc";
            if (sortBy == "deletedAt")
            {
                logs = isAsc 
                    ? logs.OrderBy(l => l.DeletedAt ?? (isAsc ? DateTimeOffset.MaxValue : DateTimeOffset.MinValue)) 
                    : logs.OrderByDescending(l => l.DeletedAt ?? (isAsc ? DateTimeOffset.MaxValue : DateTimeOffset.MinValue));
            }
            else if (sortBy == "fileSizeBytes")
            {
                logs = isAsc 
                    ? logs.OrderBy(l => l.FileSizeBytes) 
                    : logs.OrderByDescending(l => l.FileSizeBytes);
            }
            else // uploadedAt default
            {
                logs = isAsc 
                    ? logs.OrderBy(l => l.UploadedAt) 
                    : logs.OrderByDescending(l => l.UploadedAt);
            }

            var logsList = logs.ToList();
            var totalCount = logsList.Count;

            // 3. Paginate
            var paginatedLogs = logsList.Skip(offset).Take(limit).ToList();

            return Results.Ok(new PaginatedResponse(paginatedLogs, totalCount));
        })
        .WithTags("Configuracion")
        .WithName("ObtenerHistorialGlobalAlmacenamiento");

        return endpoints;
    }
}
