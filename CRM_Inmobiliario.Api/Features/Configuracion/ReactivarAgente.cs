using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Supabase.Gotrue;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ReactivarAgenteFeature
{
    public static void MapReactivarAgenteEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/configuracion/agentes/{id:guid}/reactivar", async (Guid id, ClaimsPrincipal user, CrmDbContext context, Supabase.Client supabase) =>
        {


            var agenteDestino = await context.Agents.AnyAsync(a => a.Id == id && !a.Activo);
            if (!agenteDestino)
            {
                return Results.BadRequest(new { error = "El agente no existe o ya se encuentra activo." });
            }

            // 2. Activar Agente en la BD
            await context.Agents
                .Where(a => a.Id == id)
                .ExecuteUpdateAsync(s => s.SetProperty(a => a.Activo, true));

            // 3. Supabase Auth Restore (Remove Ban)
            try
            {
                var serviceRoleKey = Environment.GetEnvironmentVariable("SUPABASE_ROLE_KEY");
                if (!string.IsNullOrEmpty(serviceRoleKey))
                {
                    var adminAuth = supabase.AdminAuth(serviceRoleKey);
                    // Estableciendo BanDuration a "0h" o string vacio remueve el baneo
                    await adminAuth.UpdateUserById(id.ToString(), new AdminUserAttributes { BanDuration = "none" });
                }
            }
            catch (Exception)
            {

            }

            return Results.Ok(new { message = "Agente reactivado exitosamente. Su acceso a la plataforma ha sido restaurado." });
        })
        .RequireAuthorization("AdminPolicy")
        .WithTags("Configuracion")
        .WithName("ReactivarAgente");
    }
}
