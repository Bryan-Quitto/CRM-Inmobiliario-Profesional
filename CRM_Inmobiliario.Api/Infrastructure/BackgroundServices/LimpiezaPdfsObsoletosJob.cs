using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Amazon.S3;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class LimpiezaPdfsObsoletosJob
{
    private readonly CrmDbContext _context;
    private readonly IAmazonS3 _s3Client;
    private readonly IConfiguration _config;
    private readonly ILogger<LimpiezaPdfsObsoletosJob> _logger;

    public LimpiezaPdfsObsoletosJob(
        CrmDbContext context,
        IAmazonS3 s3Client,
        IConfiguration config,
        ILogger<LimpiezaPdfsObsoletosJob> logger)
    {
        _context = context;
        _s3Client = s3Client;
        _config = config;
        _logger = logger;
    }

    public async Task ExecuteAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Iniciando tarea de limpieza de PDFs obsoletos.");

        var bucketName = _config["R2_BUCKET_NAME"];
        if (string.IsNullOrEmpty(bucketName))
        {
            _logger.LogWarning("No se ha configurado R2_BUCKET_NAME.");
            return;
        }

        // Obtener solo las propiedades que han sido actualizadas
        // Evitamos traer todas las columnas, solo las necesarias.
        var propiedadesActualizadas = await _context.Properties
            .Where(p => p.FechaActualizacion != null)
            .Select(p => new { p.Id, p.FechaActualizacion })
            .ToListAsync(cancellationToken);

        int eliminados = 0;

        foreach (var propiedad in propiedadesActualizadas)
        {
            var key = $"propiedades/{propiedad.Id}/ficha_{propiedad.Id}.pdf";

            try
            {
                var metadata = await _s3Client.GetObjectMetadataAsync(bucketName, key, cancellationToken);
                
                // Si la fecha de actualización de la propiedad es posterior a la última modificación del PDF,
                // significa que el PDF está obsoleto y podemos eliminarlo para ahorrar espacio.
                if (propiedad.FechaActualizacion!.Value > metadata.LastModified)
                {
                    _logger.LogInformation("Eliminando PDF obsoleto para la propiedad {Id}", propiedad.Id);
                    await _s3Client.DeleteObjectAsync(bucketName, key, cancellationToken);
                    eliminados++;
                }
            }
            catch (AmazonS3Exception ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                // El archivo ya no existe, podemos ignorarlo
                continue;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error al comprobar o eliminar el PDF obsoleto para la propiedad {Id}", propiedad.Id);
            }
        }

        _logger.LogInformation("Tarea de limpieza finalizada. PDFs eliminados: {Count}", eliminados);
    }
}
