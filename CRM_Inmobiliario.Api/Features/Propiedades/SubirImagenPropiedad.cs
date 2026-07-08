using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Exceptions;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class SubirImagenPropiedadFeature
{
    public static void MapSubirImagenPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/propiedades/{id}/imagenes", async (
            [FromRoute] Guid id,
            [FromQuery] Guid? sectionId,
            [FromQuery] string? descripcion,
            IFormFile file,
            ClaimsPrincipal user,
            CrmDbContext context,
            CRM_Inmobiliario.Api.Infrastructure.Services.IR2StorageService r2Storage) =>
        {
            var agenteId = user.GetRequiredUserId();

            if (file == null || file.Length == 0)
                return Results.BadRequest("No se proporcionó ningún archivo.");

            // 1. Verificar si la propiedad existe y el usuario tiene permisos de gestión
            var propiedad = await context.Properties
                .Include(p => p.Media)
                .Include(p => p.Agente)
                .Include(p => p.Transactions)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (propiedad == null)
                return Results.NotFound("Propiedad no encontrada.");

            if (!PropertyPermissionsHelper.CanManage(propiedad, agenteId))
                return Results.Json(new { Message = "No tienes permisos para subir imágenes a esta propiedad." }, statusCode: StatusCodes.Status403Forbidden);

            // 2. Validar extensión de imagen
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!extensionesPermitidas.Contains(extension))
                return Results.BadRequest("Formato de imagen no soportado. Use JPG, PNG o WEBP.");

            // 2.1 Validar Magic Numbers (Prevención de Content Spoofing y Malware)
            using var headerStream = file.OpenReadStream();
            var headerBytes = new byte[12];
            await headerStream.ReadExactlyAsync(headerBytes, 0, 12);
            
            bool isJpg = headerBytes[0] == 0xFF && headerBytes[1] == 0xD8 && headerBytes[2] == 0xFF;
            bool isPng = headerBytes[0] == 0x89 && headerBytes[1] == 0x50 && headerBytes[2] == 0x4E && headerBytes[3] == 0x47;
            bool isWebp = headerBytes[0] == 0x52 && headerBytes[1] == 0x49 && headerBytes[2] == 0x46 && headerBytes[3] == 0x46 && 
                          headerBytes[8] == 0x57 && headerBytes[9] == 0x45 && headerBytes[10] == 0x42 && headerBytes[11] == 0x50;

            if (!isJpg && !isPng && !isWebp)
                return Results.BadRequest("El contenido real del archivo no corresponde a una imagen válida (riesgo de malware detectado).");

            // 3. Generar nombre de archivo único
            var nombreArchivo = $"{Guid.NewGuid()}{extension}";

            try
            {
                // 4. Leer archivo y subir a R2
                using var stream = file.OpenReadStream();
                using var memoryStream = new MemoryStream();
                await stream.CopyToAsync(memoryStream);
                var bytes = memoryStream.ToArray();

                var key = $"propiedades/{id}/{nombreArchivo}";
                string urlPublica;
                try
                {
                    urlPublica = await r2Storage.UploadAsync(bytes, key, file.ContentType, agenteId);
                }
                catch (StorageQuotaExceededException ex)
                {
                    return Results.Problem(ex.Message, statusCode: StatusCodes.Status400BadRequest);
                }

                if (string.IsNullOrEmpty(urlPublica))
                    return Results.Problem("La subida a R2 no devolvió una ruta válida.");

                // 6. Registrar metadatos en la base de datos (PropertyMedia)
                var media = new PropertyMedia
                {
                    Id = Guid.NewGuid(),
                    PropiedadId = id,
                    SectionId = sectionId,
                    Descripcion = descripcion,
                    TipoMultimedia = "Imagen",
                    UrlPublica = urlPublica,
                    StoragePath = nombreArchivo,
                    EsPrincipal = !propiedad.Media.Any(m => m.EsPrincipal),
                    Orden = propiedad.Media.Count + 1
                };

                context.PropertyMedia.Add(media);
                await context.SaveChangesAsync();
                await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);

                return Results.Ok(new 
                { 
                    media.Id,
                    media.UrlPublica,
                    media.EsPrincipal,
                    media.SectionId,
                    media.Descripcion
                });
            }
            catch (Exception ex)
            {
                // En un entorno real, registraríamos el error completo. Aquí devolvemos el mensaje para debug.
                return Results.Problem($"Error durante el proceso de subida: {ex.Message}");
            }
        })
        .DisableAntiforgery()
        .WithTags("Propiedades")
        .WithName("SubirImagenPropiedad");
    }
}

