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

public static class SubirFotoPerfilFeature
{
    public static void MapSubirFotoPerfilEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/agentes/{id}/foto-perfil", async (
            [FromRoute] Guid id,
            IFormFile file,
            ClaimsPrincipal user,
            CrmDbContext context,
            IR2StorageService r2Storage) =>
        {
            var agenteId = user.GetRequiredUserId();
            if (agenteId != id) return Results.Forbid();

            if (file == null || file.Length == 0)
                return Results.BadRequest("No se proporcionó ningún archivo.");

            const long MaxProfilePhotoBytes = 20 * 1024 * 1024; // 20 MB
            if (file.Length > MaxProfilePhotoBytes)
                return Results.BadRequest($"La foto de perfil no puede superar {MaxProfilePhotoBytes / 1024 / 1024} MB.");

            var agente = await context.Agents.FindAsync(id);
            if (agente == null) return Results.NotFound("Agente no encontrado.");

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var nombreArchivo = $"profile-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{extension}";
            var key = $"perfiles/{id}/{nombreArchivo}";

            using var stream = file.OpenReadStream();
            using var memoryStream = new MemoryStream();
            await stream.CopyToAsync(memoryStream);
            var bytes = memoryStream.ToArray();

            if (!string.IsNullOrEmpty(agente.FotoUrl) && agente.FotoUrl.Contains("/perfiles/"))
            {
                var oldPath = new Uri(agente.FotoUrl).AbsolutePath.TrimStart('/'); 
                var keyPart = oldPath.Substring(oldPath.IndexOf("perfiles/"));
                if (!string.IsNullOrEmpty(keyPart))
                {
                    await r2Storage.DeleteWithQuotaLiberationAsync(keyPart, agenteId);
                }
            }

            string urlPublica;
            try
            {
                urlPublica = await r2Storage.UploadAsync(bytes, key, file.ContentType, agenteId, "Perfil", null, "Foto de Perfil");
            }
            catch (StorageQuotaExceededException ex)
            {
                return Results.Problem(ex.Message, statusCode: StatusCodes.Status400BadRequest);
            }
            
            agente.FotoUrl = urlPublica;
            await context.SaveChangesAsync();

            return Results.Ok(new { url = urlPublica });
        })
        .DisableAntiforgery()
        .WithTags("Configuracion")
        .WithName("SubirFotoPerfil");
        
        app.MapDelete("/agentes/{id}/foto-perfil", async (
            [FromRoute] Guid id,
            ClaimsPrincipal user,
            CrmDbContext context,
            IR2StorageService r2Storage) =>
        {
            var agenteId = user.GetRequiredUserId();
            if (agenteId != id) return Results.Forbid();

            var agente = await context.Agents.FindAsync(id);
            if (agente == null) return Results.NotFound();

            if (!string.IsNullOrEmpty(agente.FotoUrl) && agente.FotoUrl.Contains("/perfiles/"))
            {
                var oldPath = new Uri(agente.FotoUrl).AbsolutePath.TrimStart('/'); 
                var keyPart = oldPath.Substring(oldPath.IndexOf("perfiles/"));
                if (!string.IsNullOrEmpty(keyPart))
                {
                    await r2Storage.DeleteWithQuotaLiberationAsync(keyPart, agenteId);
                }
            }
            
            agente.FotoUrl = null;
            await context.SaveChangesAsync();
            return Results.NoContent();
        })
        .WithTags("Configuracion")
        .WithName("EliminarFotoPerfil");
    }
}
