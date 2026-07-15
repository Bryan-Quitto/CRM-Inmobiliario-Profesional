using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.Extensions.Configuration;
using Amazon.S3;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ObtenerPdfStatusPropiedadFeature
{
    public static RouteHandlerBuilder MapObtenerPdfStatusPropiedadEndpoint(this IEndpointRouteBuilder app)
    {
        return app.MapGet("/propiedades/{id:guid}/pdf-status", async (Guid id, ClaimsPrincipal user, IPdfGeneratorQueue pdfQueue, IConfiguration config, IAmazonS3 s3Client, CRM_Inmobiliario.Api.Infrastructure.Persistence.CrmDbContext context) =>
        {
            var currentUserId = user.GetRequiredUserId();
            var isGenerating = pdfQueue.IsGenerating(id, currentUserId);
            var publicUrlBase = config["R2_PUBLIC_URL"];
            var bucketName = config["R2_BUCKET_NAME"];
            var key = $"propiedades/{id}/ficha_{id}_{currentUserId}.pdf";
            var url = $"{publicUrlBase?.TrimEnd('/')}/{key}";

            bool exists = false;

            if (!isGenerating)
            {
                try
                {
                    var metadata = await s3Client.GetObjectMetadataAsync(bucketName, key);
                    
                    // Verificar si la propiedad fue editada DESPUÉS de que se generó el PDF
                    var propertyUpdateDate = await context.Properties
                        .Where(p => p.Id == id)
                        .Select(p => p.FechaActualizacion)
                        .FirstOrDefaultAsync();

                    if (propertyUpdateDate.HasValue && propertyUpdateDate.Value > metadata.LastModified)
                    {
                        // El PDF está desactualizado, el frontend debe mostrar "Generar Ficha"
                        exists = false;
                    }
                    else
                    {
                        exists = true;
                    }
                }
                catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    exists = false;
                }
                catch
                {
                    exists = false;
                }
            }

            return Results.Ok(new { IsGenerating = isGenerating, PdfUrl = url, Exists = exists });
        })
        .WithTags("Propiedades")
        .WithName("ObtenerPdfStatusPropiedad")
        .AddEndpointFilter<CRM_Inmobiliario.Api.Infrastructure.Security.SecurityTelemetryFilter>();
    }
}
