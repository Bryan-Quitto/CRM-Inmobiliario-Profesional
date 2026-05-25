using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Supabase.Gotrue;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class DesactivarAgenteFeature
{
    public record Request(Guid NuevoAgenteId);

    public static void MapDesactivarAgenteEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/configuracion/agentes/{id:guid}/desactivar", async (Guid id, Request request, ClaimsPrincipal user, CrmDbContext context, Supabase.Client supabase) =>
        {
            var currentUserId = user.GetRequiredUserId();
            
            // 1. Strict Access Control
            if (currentUserId.ToString() != "d4a6efdd-b801-40fb-901e-64e36f6b1400")
            {
                return Results.Forbid();
            }

            if (id == request.NuevoAgenteId)
            {
                return Results.BadRequest(new { error = "El nuevo agente no puede ser el mismo que se está desactivando." });
            }

            var agenteDestino = await context.Agents.AnyAsync(a => a.Id == request.NuevoAgenteId && a.Activo);
            if (!agenteDestino)
            {
                return Results.BadRequest(new { error = "El agente destino no existe o no está activo." });
            }

            // 2. Atomic Database Transaction with Execution Strategy
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

                    // Deactivate Agent
                    await context.Agents
                        .Where(a => a.Id == id)
                        .ExecuteUpdateAsync(s => s.SetProperty(a => a.Activo, false));

                    await transaction.CommitAsync();
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    throw;
                }
            });

            // 3. Supabase Auth Revocation (Ban for 100 years = 876000 hours)
            try
            {
                var serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");
                if (!string.IsNullOrEmpty(serviceRoleKey))
                {
                    var adminAuth = supabase.AdminAuth(serviceRoleKey);
                    await adminAuth.UpdateUserById(id.ToString(), new AdminUserAttributes { BanDuration = "876000h" });
                }
            }
            catch (Exception ex)
            {
                // Si falla el baneo por alguna razón, igual retornamos OK porque la BD ya se actualizó
                Console.WriteLine($"Error baneando en Supabase: {ex.Message}");
            }

            return Results.Ok(new { message = "Agente desactivado y cartera reasignada exitosamente." });
        })
        .WithTags("Configuracion")
        .WithName("DesactivarAgente");
    }
}
