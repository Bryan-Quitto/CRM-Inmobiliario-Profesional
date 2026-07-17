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

            const long MaxImageSizeBytes = 20 * 1024 * 1024; // 20 MB
            if (file.Length > MaxImageSizeBytes)
                return Results.BadRequest($"La imagen no puede superar {MaxImageSizeBytes / 1024 / 1024} MB.");

            // 1. Verificar si la propiedad existe y el usuario tiene permisos de gestión
            // IMPORTANTE: Usamos AsNoTracking para que EF Core no rastree una entidad obsoleta 
            // que luego cause un DbUpdateConcurrencyException tras la lenta subida a R2.
            var propiedad = await context.Properties
                .AsNoTracking()
                .Include(p => p.Agente)
                .Include(p => p.Transactions)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (propiedad == null)
                return Results.NotFound("Propiedad no encontrada.");

            if (!PropertyPermissionsHelper.CanManage(propiedad, agenteId))
                return Results.Json(new { Message = "No tienes permisos para subir imágenes a esta propiedad." }, statusCode: StatusCodes.Status403Forbidden);

            if (PropertyPermissionsHelper.IsLockedByAntiquity(propiedad))
                return Results.Json(new { Message = "La propiedad ha sido bloqueada para modificaciones de galería por antigüedad (más de 1 año cerrada)." }, statusCode: StatusCodes.Status403Forbidden);

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
                    string targetContext = "Galería General";
                    if (sectionId.HasValue)
                    {
                        var sectionName = await context.PropertyGallerySections
                            .Where(s => s.Id == sectionId.Value)
                            .Select(s => s.Nombre)
                            .FirstOrDefaultAsync();
                        if (!string.IsNullOrEmpty(sectionName))
                        {
                            targetContext = $"Sección: {sectionName}";
                        }
                    }
                    
                    urlPublica = await r2Storage.UploadAsync(bytes, key, file.ContentType, agenteId, "Propiedad", id.ToString(), targetContext);
                }
                catch (StorageQuotaExceededException ex)
                {
                    return Results.Problem(ex.Message, statusCode: StatusCodes.Status400BadRequest);
                }

                if (string.IsNullOrEmpty(urlPublica))
                    return Results.Problem("La subida a R2 no devolvió una ruta válida.");

                // 6. Registrar metadatos en la base de datos con bloqueo de concurrencia
                var strategy = context.Database.CreateExecutionStrategy();
                var media = await strategy.ExecuteAsync(async () =>
                {
                    await using var transaction = await context.Database.BeginTransactionAsync();

                    // Adquirir un bloqueo (lock) exclusivo sobre la fila de la propiedad para que subidas paralelas se encolen
                    await context.Database.ExecuteSqlRawAsync("SELECT 1 FROM \"Properties\" WHERE \"Id\" = {0} FOR UPDATE", id);

                    // Cargar la propiedad fresca y trackeada bajo el lock para que EF Core intercepte y actualice FechaActualizacion correctamente sin DbUpdateConcurrencyException
                    var trackedProp = await context.Properties.FirstOrDefaultAsync(p => p.Id == id);

                    var currentMediaCount = await context.PropertyMedia.CountAsync(m => m.PropiedadId == id);
                    var hasPrincipal = await context.PropertyMedia.AnyAsync(m => m.PropiedadId == id && m.EsPrincipal);

                    var newMedia = new PropertyMedia
                    {
                        Id = Guid.NewGuid(),
                        PropiedadId = id,
                        SectionId = sectionId,
                        Descripcion = descripcion,
                        TipoMultimedia = "Image",
                        UrlPublica = urlPublica,
                        StoragePath = nombreArchivo,
                        EsPrincipal = !hasPrincipal,
                        Orden = currentMediaCount + 1
                    };

                    context.PropertyMedia.Add(newMedia);
                    await context.SaveChangesAsync();
                    
                    await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);
                    
                    await transaction.CommitAsync();
                    return newMedia;
                });

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
                return Results.Problem($"Error durante el proceso de subida: {ex.Message}");
            }
        })
        .DisableAntiforgery()
        .WithTags("Propiedades")
        .WithName("SubirImagenPropiedad");
    }
}