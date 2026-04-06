using System.Security.Claims;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
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
            Supabase.Client supabase,
            IPdfGeneratorQueue pdfQueue) =>
        {
            var agenteId = user.GetRequiredUserId();

            if (file == null || file.Length == 0)
                return Results.BadRequest("No se proporcionó ningún archivo.");

            // 1. Verificar si la propiedad existe y pertenece al agente
            var propiedad = await context.Properties
                .Include(p => p.Media)
                .FirstOrDefaultAsync(p => p.Id == id && p.AgenteId == agenteId);

            if (propiedad == null)
                return Results.NotFound("Propiedad no encontrada o no tiene permisos.");

            // 2. Validar extensión de imagen
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".webp" };
            if (!extensionesPermitidas.Contains(extension))
                return Results.BadRequest("Formato de imagen no soportado. Use JPG, PNG o WEBP.");

            // 3. Generar nombre de archivo único
            var nombreArchivo = $"{Guid.NewGuid()}{extension}";

            try
            {
                // 4. Leer archivo y subir a Supabase Storage
                using var stream = file.OpenReadStream();
                using var memoryStream = new MemoryStream();
                await stream.CopyToAsync(memoryStream);
                var bytes = memoryStream.ToArray();

                // Bucket configurado en Supabase: "propiedades"
                var bucket = supabase.Storage.From("propiedades");
                
                // Subir el archivo (esto devuelve el path si es exitoso)
                var uploadPath = await bucket.Upload(bytes, nombreArchivo);

                if (string.IsNullOrEmpty(uploadPath))
                    return Results.Problem("La subida a Supabase Storage no devolvió una ruta válida.");

                // 5. Obtener la URL pública del archivo subido
                var urlPublica = bucket.GetPublicUrl(nombreArchivo);

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

                // Disparar regeneración de PDF
                await pdfQueue.QueuePdfGenerationAsync(id);

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
