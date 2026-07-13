using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Infrastructure.Pdf;
using CRM_Inmobiliario.Api.Infrastructure.Pdf.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class PdfWorker : BackgroundService
{
    private readonly IPdfGeneratorQueue _queue;
    private readonly ILogger<PdfWorker> _logger;
    private readonly IServiceProvider _serviceProvider;
    private readonly IHttpClientFactory _httpClientFactory;

    public PdfWorker(
        IPdfGeneratorQueue queue, 
        ILogger<PdfWorker> logger, 
        IServiceProvider serviceProvider,
        IHttpClientFactory httpClientFactory)
    {
        _queue = queue;
        _logger = logger;
        _serviceProvider = serviceProvider;
        _httpClientFactory = httpClientFactory;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var propiedadId = await _queue.DequeuePdfGenerationAsync(stoppingToken);

                try
                {
                    await ProcessPdfAsync(propiedadId, stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error crítico al procesar el PDF para la propiedad {PropiedadId}", propiedadId);
                }
                finally
                {
                    _queue.SetStatus(propiedadId, false);
                }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error general en el PdfWorker");
            }
        }
    }

    private async Task ProcessPdfAsync(Guid propiedadId, CancellationToken ct)
    {
        // Pequeño retardo de seguridad para asegurar que la DB ha terminado de escribir
        // y evitar condiciones de carrera en sistemas distribuidos o con alta carga.
        await Task.Delay(500, ct);

        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<CrmDbContext>();
        var r2Storage = scope.ServiceProvider.GetRequiredService<CRM_Inmobiliario.Api.Infrastructure.Services.IR2StorageService>();

        var propiedad = await context.Properties
            .AsNoTracking()
            .AsSplitQuery()
            .Include(p => p.Agente)
                .ThenInclude(a => a!.Agencia)
            .Include(p => p.Media)
            .Include(p => p.GallerySections)
                .ThenInclude(s => s.Media)
            .FirstOrDefaultAsync(p => p.Id == propiedadId, ct);

        if (propiedad == null)
        {
            return;
        }

        try
        {
            var imagenPrincipalTask = !string.IsNullOrEmpty(propiedad.Media.FirstOrDefault(m => m.EsPrincipal)?.UrlPublica)
                ? DownloadImageAsync(propiedad.Media.First(m => m.EsPrincipal).UrlPublica, ct)
                : Task.FromResult<byte[]?>(null);

            var agenteLogoTask = !string.IsNullOrEmpty(propiedad.Agente?.LogoUrl)
                ? DownloadImageAsync(propiedad.Agente.LogoUrl, ct)
                : Task.FromResult<byte[]?>(null);

            var agenteFotoTask = !string.IsNullOrEmpty(propiedad.Agente?.FotoUrl)
                ? DownloadImageAsync(propiedad.Agente.FotoUrl, ct)
                : Task.FromResult<byte[]?>(null);

            // Iniciar descargas en paralelo
            var imagenPrincipal = await imagenPrincipalTask;
            var agenteLogo = await agenteLogoTask;
            var agenteFoto = await agenteFotoTask;

            var seccionesData = new List<FichaSeccionData>();
            foreach (var s in propiedad.GallerySections.OrderBy(s => s.Orden))
            {
                var imagenesSeccion = new List<FichaImagenData>();
                var mediaTasks = s.Media.OrderBy(m => m.Orden).Select(async m =>
                {
                    var bytes = await DownloadImageAsync(m.UrlPublica, ct);
                    return new { Bytes = bytes, Descripcion = m.Descripcion, Orden = m.Orden };
                }).ToList();

                var results = await Task.WhenAll(mediaTasks);

                foreach (var res in results.OrderBy(r => r.Orden))
                {
                    if (res.Bytes != null) imagenesSeccion.Add(new FichaImagenData(res.Bytes, res.Descripcion));
                }
                seccionesData.Add(new FichaSeccionData(s.Nombre, s.Descripcion, imagenesSeccion));
            }
            
            var data = new FichaPdfData(
                propiedad.Titulo, propiedad.Descripcion, propiedad.TipoPropiedad,
                propiedad.Operacion, propiedad.Precio, $"{propiedad.Sector}, {propiedad.Ciudad}",
                propiedad.Habitaciones, propiedad.Banos, propiedad.AreaTotal,
                propiedad.AreaTerreno, propiedad.AreaConstruccion, propiedad.Estacionamientos,
                propiedad.MediosBanos, propiedad.AniosAntiguedad,
                imagenPrincipal,
                $"{propiedad.Agente?.Nombre ?? "Agente"} {propiedad.Agente?.Apellido ?? ""}".Trim(), 
                propiedad.Agente?.Telefono ?? "",
                propiedad.Agente?.Agencia?.Nombre, agenteLogo, agenteFoto, seccionesData
            );

            // PRODUCCIÓN: EnableDebugging ELIMINADO intencionalmente.
            // En true, QuestPDF activa su servidor hot-reload y escribe archivos de
            // diagnóstico a disco, causando UnauthorizedAccessException en contenedores efímeros (Railway).
            var document = new PropiedadFichaDocument(data);
            var pdfBytes = document.GeneratePdf();

            var fileName = $"ficha_{propiedadId}.pdf";
            var key = $"propiedades/{propiedadId}/{fileName}";
            
            // AWS SDK S3 permite definir Cache-Control pero R2 maneja la caché principalmente via sus Cache Rules o CDN,
            // de igual forma, la implementación UploadAsync por defecto basta para el Storage subyacente.
            await r2Storage.UploadAsync(pdfBytes, key, "application/pdf", propiedad.AgenteId);
        }
        catch (Exception)
        {
            throw;
        }
    }

    private async Task<byte[]?> DownloadImageAsync(string url, CancellationToken ct)
    {
        using var scope = _serviceProvider.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
        
        var publicUrlBase = config["R2_PUBLIC_URL"]?.TrimEnd('/');
        
        // Si la URL es de nuestro bucket R2, saltamos el WAF de Cloudflare y la descargamos vía la API de S3 interna
        if (!string.IsNullOrEmpty(publicUrlBase) && url.StartsWith(publicUrlBase, StringComparison.OrdinalIgnoreCase))
        {
            try
            {
                var s3Client = scope.ServiceProvider.GetRequiredService<Amazon.S3.IAmazonS3>();
                var bucketName = config["R2_BUCKET_NAME"];
                var key = url.Substring(publicUrlBase.Length).TrimStart('/');
                
                using var response = await s3Client.GetObjectAsync(bucketName, key, ct);
                using var ms = new MemoryStream();
                await response.ResponseStream.CopyToAsync(ms, ct);
                return ms.ToArray();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error al descargar imagen desde S3 internamente {Url}", url);
                return null;
            }
        }

        // Para URLs externas (ej. si guardan URLs de otro servidor), intentamos con HTTP
        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            
            var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Error al descargar imagen externa {Url}. Status: {StatusCode}", url, response.StatusCode);
                return null;
            }
            
            return await response.Content.ReadAsByteArrayAsync(ct); 
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error HTTP al descargar imagen externa {Url}", url);
            return null;
        }
    }
}
