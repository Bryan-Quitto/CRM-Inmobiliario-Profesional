using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.Contactos.FusionarContactos;

public static class FusionarContactosFeature
{
    public record Command(Guid PrimaryContactoId, Guid SecondaryContactoId);

    public static void MapFusionarContactosEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/contactos/fusionar", async (Command command, ClaimsPrincipal user, CrmDbContext context, IOutputCacheStore cacheStore, ILoggerFactory loggerFactory, CancellationToken ct) =>
        {
            var logger = loggerFactory.CreateLogger("FusionarContactosFeature");

            if (command.PrimaryContactoId == command.SecondaryContactoId)
            {
                return Results.BadRequest(new { error = "No se puede fusionar un contacto consigo mismo." });
            }

            var agenteId = user.GetRequiredUserId();

            var contactos = await context.Contactos
                .Where(c => (c.Id == command.PrimaryContactoId || c.Id == command.SecondaryContactoId) && c.AgenteId == agenteId)
                .ToListAsync(ct);

            var primary = contactos.FirstOrDefault(c => c.Id == command.PrimaryContactoId);
            var secondary = contactos.FirstOrDefault(c => c.Id == command.SecondaryContactoId);

            if (primary is null || secondary is null)
            {
                return Results.NotFound(new { error = "Uno o ambos contactos no fueron encontrados o no pertenecen al agente." });
            }

            if (await context.AgentArchivedContacts.AnyAsync(a => a.AgentId == agenteId && (a.ContactoId == command.PrimaryContactoId || a.ContactoId == command.SecondaryContactoId), ct))
            {
                return Results.BadRequest(new { message = "No puedes modificar un registro archivado" });
            }

            // Anti-Collision Channel Validation (Permitir duplicados literales)
            var hasWhatsapp1 = !string.IsNullOrWhiteSpace(primary.Telefono);
            var hasWhatsapp2 = !string.IsNullOrWhiteSpace(secondary.Telefono);
            var hasFacebook1 = !string.IsNullOrWhiteSpace(primary.FacebookSenderId);
            var hasFacebook2 = !string.IsNullOrWhiteSpace(secondary.FacebookSenderId);

            if (hasWhatsapp1 && hasWhatsapp2 && primary.Telefono != secondary.Telefono)
            {
                return Results.BadRequest(new { error = "No se pueden fusionar contactos si ambos tienen distintos canales de WhatsApp activos." });
            }

            if (hasFacebook1 && hasFacebook2 && primary.FacebookSenderId != secondary.FacebookSenderId)
            {
                return Results.BadRequest(new { error = "No se pueden fusionar contactos si ambos tienen distintos canales de Facebook activos." });
            }

            var strategy = context.Database.CreateExecutionStrategy();
            return await strategy.ExecuteAsync(async () =>
            {
                await using var transaction = await context.Database.BeginTransactionAsync(ct);

                try
            {
                // 1:N and M:N relations - Single Trip Pattern
                var sql = @"
                    UPDATE ""Tasks"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1};
                    UPDATE ""Interactions"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1};
                    UPDATE ""PropertyTransactions"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1};
                    UPDATE ""Properties"" SET ""PropietarioId"" = {0} WHERE ""PropietarioId"" = {1};
                    UPDATE ""Properties"" SET ""CerradoConId"" = {0} WHERE ""CerradoConId"" = {1};
                    UPDATE ""ContactoHistorialEmbudos"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1};
                    
                    UPDATE ""FacebookMessages"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1};
                    UPDATE ""WhatsappMessages"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1};
                    UPDATE ""AiActionLogs"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1};

                    -- Composite/Unique constraints reparenting with NOT EXISTS safety
                    UPDATE ""ContactDailyTokenUsages"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1} AND NOT EXISTS (SELECT 1 FROM ""ContactDailyTokenUsages"" t2 WHERE t2.""ContactoId"" = {0} AND t2.""Date"" = ""ContactDailyTokenUsages"".""Date"" AND t2.""Channel"" = ""ContactDailyTokenUsages"".""Channel"");
                    DELETE FROM ""ContactDailyTokenUsages"" WHERE ""ContactoId"" = {1};

                    UPDATE ""FacebookConversations"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1} AND NOT EXISTS (SELECT 1 FROM ""FacebookConversations"" f2 WHERE f2.""ContactoId"" = {0});
                    DELETE FROM ""FacebookConversations"" WHERE ""ContactoId"" = {1};

                    UPDATE ""WhatsappConversations"" SET ""ContactoId"" = {0} WHERE ""ContactoId"" = {1} AND NOT EXISTS (SELECT 1 FROM ""WhatsappConversations"" w2 WHERE w2.""ContactoId"" = {0});
                    DELETE FROM ""WhatsappConversations"" WHERE ""ContactoId"" = {1};

                    -- M:N relations
                    UPDATE ""ContactoInteresPropiedades"" 
                    SET ""ContactoId"" = {0} 
                    WHERE ""ContactoId"" = {1} 
                      AND NOT EXISTS (
                          SELECT 1 FROM ""ContactoInteresPropiedades"" cip2
                          WHERE cip2.""ContactoId"" = {0} AND cip2.""PropiedadId"" = ""ContactoInteresPropiedades"".""PropiedadId""
                      );
                    DELETE FROM ""ContactoInteresPropiedades"" WHERE ""ContactoId"" = {1};

                    UPDATE ""ContactoAgenteCompartidos"" 
                    SET ""ContactoId"" = {0} 
                    WHERE ""ContactoId"" = {1} 
                      AND NOT EXISTS (
                          SELECT 1 FROM ""ContactoAgenteCompartidos"" cac2
                          WHERE cac2.""ContactoId"" = {0} AND cac2.""AgenteId"" = ""ContactoAgenteCompartidos"".""AgenteId""
                      );
                    DELETE FROM ""ContactoAgenteCompartidos"" WHERE ""ContactoId"" = {1};
                ";
                await context.Database.ExecuteSqlRawAsync(sql, new object[] { primary.Id, secondary.Id }, ct);

                // Consolidate Contacto entity
                primary.EsProspecto = primary.EsProspecto || secondary.EsProspecto;
                primary.EsPropietario = primary.EsPropietario || secondary.EsPropietario;

                if (string.IsNullOrWhiteSpace(primary.Telefono) && !string.IsNullOrWhiteSpace(secondary.Telefono))
                {
                    primary.Telefono = secondary.Telefono;
                }

                if (string.IsNullOrWhiteSpace(primary.FacebookSenderId) && !string.IsNullOrWhiteSpace(secondary.FacebookSenderId))
                {
                    primary.FacebookSenderId = secondary.FacebookSenderId;
                }

                var reporteFusion = new System.Text.StringBuilder();

                if (string.IsNullOrWhiteSpace(primary.Email)) { primary.Email = secondary.Email; }
                else if (!string.IsNullOrWhiteSpace(secondary.Email) && secondary.Email != primary.Email) { reporteFusion.AppendLine($"[Fusión - Email]: {secondary.Email}"); }

                if (string.IsNullOrWhiteSpace(primary.Nombre)) { primary.Nombre = secondary.Nombre; }
                else if (!string.IsNullOrWhiteSpace(secondary.Nombre) && secondary.Nombre != primary.Nombre) { reporteFusion.AppendLine($"[Fusión - Nombre]: {secondary.Nombre}"); }

                if (string.IsNullOrWhiteSpace(primary.Apellido)) { primary.Apellido = secondary.Apellido; }
                else if (!string.IsNullOrWhiteSpace(secondary.Apellido) && secondary.Apellido != primary.Apellido) { reporteFusion.AppendLine($"[Fusión - Apellido]: {secondary.Apellido}"); }

                if (string.IsNullOrWhiteSpace(primary.Origen)) { primary.Origen = secondary.Origen; }
                else if (!string.IsNullOrWhiteSpace(secondary.Origen) && secondary.Origen != primary.Origen) { reporteFusion.AppendLine($"[Fusión - Origen]: {secondary.Origen}"); }

                if (!string.IsNullOrWhiteSpace(secondary.Notas))
                {
                    reporteFusion.AppendLine("--- Notas Secundarias ---");
                    reporteFusion.AppendLine(secondary.Notas);
                }

                if (reporteFusion.Length > 0)
                {
                    var interaction = new Interaction
                    {
                        Id = Guid.NewGuid(),
                        AgenteId = agenteId,
                        ContactoId = primary.Id,
                        TipoInteraccion = "Nota",
                        Notas = $"Reporte de Fusión (Datos Secundarios):\n{reporteFusion}",
                        FechaInteraccion = DateTimeOffset.UtcNow
                    };
                    context.Interactions.Add(interaction);
                }

                context.Contactos.Remove(secondary);

                await context.SaveChangesAsync(ct);

                // Fix: Update DB counters AFTER SaveChangesAsync so EF Core change tracker doesn't overwrite them with stale in-memory zeros
                var sqlCounters = @"
                    UPDATE ""Contactos"" 
                    SET ""NumeroInteracciones"" = (SELECT COUNT(*) FROM ""Interactions"" WHERE ""ContactoId"" = {0}),
                        ""NumeroIntereses"" = (SELECT COUNT(*) FROM ""ContactoInteresPropiedades"" WHERE ""ContactoId"" = {0}),
                        ""NumeroPropiedadesCaptadas"" = (SELECT COUNT(*) FROM ""Properties"" WHERE ""PropietarioId"" = {0}),
                        ""NumeroReservas"" = (SELECT COUNT(*) FROM ""Properties"" WHERE ""CerradoConId"" = {0} AND ""EstadoComercial"" = 'Reservada'),
                        ""NumeroCierres"" = (SELECT COUNT(*) FROM ""Properties"" WHERE ""CerradoConId"" = {0} AND (""EstadoComercial"" = 'Vendida' OR ""EstadoComercial"" = 'Alquilada'))
                    WHERE ""Id"" = {0};
                ";
                await context.Database.ExecuteSqlRawAsync(sqlCounters, new object[] { primary.Id }, ct);

                await transaction.CommitAsync(ct);

                // Evict cache in parallel without blocking (Zero-Wait policy). Use CancellationToken.None to prevent OperationCanceledException if HTTP request ends.
                _ = Task.WhenAll(
                    cacheStore.EvictByTagAsync("contactos", CancellationToken.None).AsTask(),
                    cacheStore.EvictByTagAsync("tasks", CancellationToken.None).AsTask(),
                    cacheStore.EvictByTagAsync("properties", CancellationToken.None).AsTask(),
                    cacheStore.EvictByTagAsync("interactions", CancellationToken.None).AsTask(),
                    cacheStore.EvictByTagAsync("whatsapp", CancellationToken.None).AsTask(),
                    cacheStore.EvictByTagAsync("facebook", CancellationToken.None).AsTask(),
                    cacheStore.EvictByTagAsync("tokens", CancellationToken.None).AsTask()
                );

                    return Results.Ok(new { message = "Contactos fusionados exitosamente.", primaryContactoId = primary.Id });
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error fusionando contactos. PrimaryId: {PrimaryId}, SecondaryId: {SecondaryId}", command.PrimaryContactoId, command.SecondaryContactoId);
                    throw;
                }
            });
        })
        .RequireAuthorization()
        .WithTags("Contactos")
        .WithName("FusionarContactos");
    }
}
