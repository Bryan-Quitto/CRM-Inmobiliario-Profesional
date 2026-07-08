using System.Security.Claims;
using CRM_Inmobiliario.Api.Exceptions;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.Services;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class SubirLogoAgenciaFeature
{
    public static void MapSubirLogoAgenciaEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/agentes/{id}/logo-agencia", async (
            [FromRoute] Guid id,
            IFormFile file,
            ClaimsPrincipal user,
            CrmDbContext context,
            IR2StorageService r2Storage) =>
        {
            var agenteId = user.GetRequiredUserId();
            var agente = await context.Agents.FindAsync(agenteId);
            
            if (agente == null || agente.Id != id) 
                return Results.Forbid();

            if (file == null || file.Length == 0)
                return Results.BadRequest("No se proporcionó ningún archivo.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var nombreArchivo = $"logo-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{extension}";
            var key = $"perfiles/{agenteId}/{nombreArchivo}";

            using var stream = file.OpenReadStream();
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();

            if (!string.IsNullOrEmpty(agente.LogoUrl) && agente.LogoUrl.Contains("/perfiles/"))
            {
                var oldPath = new Uri(agente.LogoUrl).AbsolutePath.TrimStart('/'); 
                var keyPart = oldPath.Substring(oldPath.IndexOf("perfiles/"));
                if (!string.IsNullOrEmpty(keyPart))
                {
                    await r2Storage.DeleteAsync(keyPart);
                }
            }

            string urlPublica;
            try
            {
                urlPublica = await r2Storage.UploadAsync(bytes, key, file.ContentType, agenteId);
            }
            catch (StorageQuotaExceededException ex)
            {
                return Results.Problem(ex.Message, statusCode: StatusCodes.Status400BadRequest);
            }
            
            agente.LogoUrl = urlPublica;
            await context.SaveChangesAsync();

            return Results.Ok(new { url = urlPublica });
        })
        .DisableAntiforgery()
        .WithTags("Configuracion")
        .WithName("SubirLogoAgencia");
        
        app.MapDelete("/agentes/{id}/logo-agencia", async (
            [FromRoute] Guid id,
            ClaimsPrincipal user,
            CrmDbContext context,
            IR2StorageService r2Storage) =>
        {
            var agenteId = user.GetRequiredUserId();
            var agente = await context.Agents.FindAsync(agenteId);
            
            if (agente == null || agente.Id != id) 
                return Results.Forbid();

            if (!string.IsNullOrEmpty(agente.LogoUrl) && agente.LogoUrl.Contains("/perfiles/"))
            {
                var oldPath = new Uri(agente.LogoUrl).AbsolutePath.TrimStart('/'); 
                var keyPart = oldPath.Substring(oldPath.IndexOf("perfiles/"));
                if (!string.IsNullOrEmpty(keyPart))
                {
                    await r2Storage.DeleteAsync(keyPart);
                }
            }
            
            agente.LogoUrl = null;
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithTags("Configuracion")
        .WithName("EliminarLogoAgencia");
    }
}
