using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ObtenerPerfil
{
    public record Response(
        Guid Id,
        string Nombre,
        string Apellido,
        string Email,
        string? Telefono,
        string? AgenciaNombre,
        Guid? AgenciaId,
        string? FotoUrl,
        string? LogoUrl,
        string? DireccionFisica,
        string? PromptPersonalIA,
        string Rol,
        string? TerminosAceptadosVersion,
        DateTimeOffset FechaCreacion,
        long MonthlyStorageBytesLimit,
        long CurrentMonthStorageBytesUsed,
        int DaysUntilStorageReset,
        int MonthlyUploadOpsLimit,
        int CurrentMonthUploadOpsUsed);

    public static IEndpointRouteBuilder MapObtenerPerfilEndpoint(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/configuracion/perfil", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var email = user.FindFirstValue(ClaimTypes.Email) 
                        ?? user.FindFirstValue("email") 
                        ?? user.FindFirstValue("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") 
                        ?? "";

            var year = DateTime.UtcNow.Year;
            var month = DateTime.UtcNow.Month;
            var daysInMonth = DateTime.DaysInMonth(year, month);
            var daysUntilReset = daysInMonth - DateTime.UtcNow.Day + 1;

            var perfilData = await context.Agents
                .AsNoTracking()
                .Include(a => a.Agencia)
                .Where(a => a.Id == agenteId)
                .Select(a => new {
                    Agent = a,
                    Usage = context.AgentStorageUsages.FirstOrDefault(u => u.AgentId == a.Id && u.Year == year && u.Month == month)
                })
                .FirstOrDefaultAsync();

            if (perfilData is null)
            {
                return Results.Ok(new Response(
                    agenteId, "", "", email, null, null, null, null, null, null, null, "Agente", null, DateTimeOffset.UtcNow,
                    209715200, 0, daysUntilReset,
                    5000, 0
                ));
            }

            var perfil = new Response(
                perfilData.Agent.Id,
                perfilData.Agent.Nombre,
                perfilData.Agent.Apellido,
                perfilData.Agent.Email,
                perfilData.Agent.Telefono,
                perfilData.Agent.Agencia != null ? perfilData.Agent.Agencia.Nombre : null,
                perfilData.Agent.AgenciaId,
                perfilData.Agent.FotoUrl,
                perfilData.Agent.LogoUrl,
                perfilData.Agent.DireccionFisica,
                perfilData.Agent.PromptPersonalIA,
                perfilData.Agent.Rol,
                perfilData.Agent.TerminosAceptadosVersion,
                perfilData.Agent.FechaCreacion,
                perfilData.Agent.MonthlyStorageBytesLimit,
                perfilData.Usage != null ? perfilData.Usage.TotalBytesUploaded : 0,
                daysUntilReset,
                perfilData.Agent.MonthlyStorageUploadsLimit,
                perfilData.Usage != null ? perfilData.Usage.UploadOpsCount : 0);

            return Results.Ok(perfil);


        })
        .WithTags("Configuracion")
        .WithName("ObtenerPerfil");

        return endpoints;
    }
}
