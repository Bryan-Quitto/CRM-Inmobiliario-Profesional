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
        catch (Exception)
        {
        }
        finally
        {
            _queue.SetStatus(propiedadId, false);
        }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception)
            {
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
            
            var imagenPrincipal = !string.IsNullOrEmpty(propiedad.Media.FirstOrDefault(m => m.EsPrincipal)?.UrlPublica)
                ? await DownloadImageAsync(propiedad.Media.First(m => m.EsPrincipal).UrlPublica, ct)
                : null;

            byte[]? agenteLogo = null;
            if (!string.IsNullOrEmpty(propiedad.Agente?.LogoUrl))
            {
                agenteLogo = await DownloadImageAsync(propiedad.Agente.LogoUrl, ct);
            }

            var seccionesData = new List<FichaSeccionData>();
            foreach (var s in propiedad.GallerySections.OrderBy(s => s.Orden))
            {
                var imagenesSeccion = new List<FichaImagenData>();
                foreach (var m in s.Media.OrderBy(m => m.Orden))
                {
                    var bytes = await DownloadImageAsync(m.UrlPublica, ct);
                    if (bytes != null) imagenesSeccion.Add(new FichaImagenData(bytes, m.Descripcion));
                }
                seccionesData.Add(new FichaSeccionData(s.Nombre, s.Descripcion, imagenesSeccion));
            }
            
            var data = new FichaPdfData(
                propiedad.Titulo, propiedad.Descripcion, propiedad.TipoPropiedad,
                propiedad.Operacion, propiedad.Precio, $"{propiedad.Direccion}, {propiedad.Sector}, {propiedad.Ciudad}",
                propiedad.Habitaciones, propiedad.Banos, propiedad.AreaTotal, imagenPrincipal,
                $"{propiedad.Agente?.Nombre ?? "Agente"} {propiedad.Agente?.Apellido ?? ""}".Trim(), 
                $"{propiedad.Agente?.Email ?? ""} | {propiedad.Agente?.Telefono ?? ""}".Trim(' ', '|'),
                propiedad.Agente?.Agencia?.Nombre, agenteLogo, seccionesData
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
            await r2Storage.UploadAsync(pdfBytes, key, "application/pdf");
        }
        catch (Exception)
        {
            throw;
        }
    }

    private async Task<byte[]?> DownloadImageAsync(string url, CancellationToken ct)
    {
        var client = _httpClientFactory.CreateClient();
        return await client.GetByteArrayAsync(url, ct); 
    }
}
