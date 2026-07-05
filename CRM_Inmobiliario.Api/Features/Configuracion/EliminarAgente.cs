using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Supabase.Gotrue;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class EliminarAgenteFeature
{
    public record Request(Guid NuevoAgenteId);

    public static void MapEliminarAgenteEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/configuracion/agentes/{id:guid}/eliminar", async (Guid id, Request request, ClaimsPrincipal user, CrmDbContext context, Supabase.Client supabase) =>
        {
            if (id == request.NuevoAgenteId)
            {
                return Results.BadRequest(new { error = "El nuevo agente no puede ser el mismo que se está eliminando." });
            }

            var agenteDestino = await context.Agents.AnyAsync(a => a.Id == request.NuevoAgenteId && a.Activo);
            if (!agenteDestino)
            {
                return Results.BadRequest(new { error = "El agente destino no existe o no está activo." });
            }

            // 1. Atomic Database Transaction with Execution Strategy
            var strategy = context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await context.Database.BeginTransactionAsync();
                try
                {
                    // Transfer ALL Properties
                    await context.Properties
                        .Where(p => p.AgenteId == id)
                        .ExecuteUpdateAsync(s => s.SetProperty(p => p.AgenteId, request.NuevoAgenteId));

                    // Transfer ALL Contacts
                    await context.Contactos
                        .Where(c => c.AgenteId == id)
                        .ExecuteUpdateAsync(s => s.SetProperty(c => c.AgenteId, request.NuevoAgenteId));

                    // Delete Push Subscriptions
                    await context.AgentPushSubscriptions
                        .Where(s => s.AgentId == id)
                        .ExecuteDeleteAsync();

                    // Soft Delete Agent (Set Activo = false, FechaEliminacion = NOW)
                    await context.Agents
                        .Where(a => a.Id == id)
                        .ExecuteUpdateAsync(s => s
                            .SetProperty(a => a.Activo, false)
                            .SetProperty(a => a.FechaEliminacion, DateTimeOffset.UtcNow));

                    await transaction.CommitAsync();
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });

            // 2. Supabase Auth Deletion
            try
            {
                var serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");
                if (!string.IsNullOrEmpty(serviceRoleKey))
                {
                    var adminAuth = supabase.AdminAuth(serviceRoleKey);
                    await adminAuth.DeleteUser(id.ToString());
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error eliminando usuario en Supabase: {ex.Message}");
                // Si la eliminación dura falla, hacemos fallback a un Ban de 100 años como en Desactivar
                try
                {
                    var serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");
                    if (!string.IsNullOrEmpty(serviceRoleKey))
                    {
                        var adminAuth = supabase.AdminAuth(serviceRoleKey);
                        await adminAuth.UpdateUserById(id.ToString(), new AdminUserAttributes { BanDuration = "876000h" });
                    }
                }
                catch { }
            }

            return Results.Ok(new { message = "Agente eliminado y cartera reasignada exitosamente." });
        })
        .RequireAuthorization("AdminPolicy")
        .WithTags("Configuracion")
        .WithName("EliminarAgente");
    }
}
