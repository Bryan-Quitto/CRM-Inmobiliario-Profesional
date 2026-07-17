using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class EliminarArchivosAlmacenamiento
{
    public record EliminarArchivosRequest(List<Guid> LogIds);

    public static IEndpointRouteBuilder MapEliminarArchivosAlmacenamientoEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapPost("/configuracion/almacenamiento/eliminar", async (ClaimsPrincipal user, [FromBody] EliminarArchivosRequest req, CrmDbContext context, CancellationToken ct) =>
        {
            var agenteId = user.GetRequiredUserId();
            var logs = await context.AgentStorageFileLogs
                .Where(l => l.AgentId == agenteId && req.LogIds.Contains(l.Id) && !l.IsDeleted)
                .ToListAsync(ct);

            if (!logs.Any()) return Results.Ok();

            var executionStrategy = context.Database.CreateExecutionStrategy();
            await executionStrategy.ExecuteAsync(async () =>
            {
                await using var transaction = await context.Database.BeginTransactionAsync(ct);
                try
                {
                    // 1. Agentes (Perfil o Agencia)
                    var agentLogs = logs.Where(l => l.TargetType == "Perfil" || l.TargetType == "Agencia").ToList();
                    if (agentLogs.Any())
                    {
                        var agente = await context.Agents.FirstOrDefaultAsync(a => a.Id == agenteId, ct);
                        if (agente != null)
                        {
                            foreach (var log in agentLogs)
                            {
                                if (log.TargetType == "Perfil" && !string.IsNullOrEmpty(agente.FotoUrl) && agente.FotoUrl.Contains(log.ObjectKey))
                                {
                                    agente.FotoUrl = null;
                                }
                                else if (log.TargetType == "Agencia" && !string.IsNullOrEmpty(agente.LogoUrl) && agente.LogoUrl.Contains(log.ObjectKey))
                                {
                                    agente.LogoUrl = null;
                                }
                            }
                        }
                    }

                    // 2. Propiedades (Media) - Bulk Load para evitar N+1 query timeout
                    var propLogs = logs.Where(l => l.TargetType == "Propiedad" && l.Context != "PDF Ficha Comercial" && Guid.TryParse(l.TargetId, out _)).ToList();
                    if (propLogs.Any())
                    {
                        var mediaKeys = propLogs.Select(l => new { 
                            PropId = Guid.Parse(l.TargetId!), 
                            MediaPath = l.ObjectKey.Split('/').LastOrDefault() 
                        }).Where(x => !string.IsNullOrEmpty(x.MediaPath)).ToList();

                        var propIds = mediaKeys.Select(x => x.PropId).Distinct().ToList();
                        var mediaPaths = mediaKeys.Select(x => x.MediaPath).Distinct().ToList();

                        var propertyMedias = await context.PropertyMedia
                            .Where(m => propIds.Contains(m.PropiedadId) && mediaPaths.Contains(m.StoragePath))
                            .ToListAsync(ct);

                        foreach (var media in propertyMedias)
                        {
                            if (mediaKeys.Any(k => k.PropId == media.PropiedadId && k.MediaPath == media.StoragePath))
                            {
                                context.PropertyMedia.Remove(media);
                            }
                        }
                    }

                    // 3. WhatsApp (Uno a uno ya que rara vez son eliminados en masa y la transpilación Contains es compleja)
                    var whatsappLogs = logs.Where(l => l.TargetType == "WhatsApp").ToList();
                    foreach (var log in whatsappLogs)
                    {
                        var messages = await context.WhatsappMessages
                            .Where(m => m.AgenteId == agenteId && m.Contenido.Contains(log.ObjectKey))
                            .ToListAsync(ct);
                            
                        foreach (var m in messages)
                        {
                            var idxStart = m.Contenido.IndexOf("[Audio Note:");
                            var idxEnd = m.Contenido.IndexOf("]", idxStart + 1);
                            if (idxStart >= 0 && idxEnd > idxStart)
                            {
                                m.Contenido = m.Contenido.Substring(0, idxStart) + "[Audio eliminado para liberar espacio]" + m.Contenido.Substring(idxEnd + 1);
                            }
                            else 
                            {
                                m.Contenido += "\n[Audio eliminado para liberar espacio]";
                            }
                        }
                    }
                    
                    var allKeys = logs.Select(l => l.ObjectKey).Distinct().ToList();
                    if (allKeys.Any())
                    {
                        await context.QueueStorageDeletionsWithQuotaLiberationAsync(allKeys, agenteId, ct);
                    }

                    await transaction.CommitAsync(ct);
                }
                catch
                {
                    await transaction.RollbackAsync(ct);
                    throw;
                }
            });
            
            return Results.Ok();
        })
        .WithTags("Configuracion")
        .WithName("EliminarArchivosAlmacenamiento");

        return endpoints;
    }
}
