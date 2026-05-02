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
        _logger.LogInformation("🚀 [WORKER] PdfWorker INICIADO y esperando mensajes en la cola...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var propiedadId = await _queue.DequeuePdfGenerationAsync(stoppingToken);
                _logger.LogInformation("📥 [WORKER] Mensaje recibido en la cola para Propiedad ID: {PropiedadId}", propiedadId);

        try
        {
            await ProcessPdfAsync(propiedadId, stoppingToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [WORKER] Error inesperado procesando PDF para {PropiedadId}", propiedadId);
        }
        finally
        {
            _queue.SetStatus(propiedadId, false);
            _logger.LogInformation("ℹ️ [WORKER] Estado de generación liberado para {PropiedadId}", propiedadId);
        }
            }
            catch (OperationCanceledException) { break; }
            catch (Exception ex)
            {
                _logger.LogError(ex, "❌ [WORKER] Error fatal en el bucle del worker.");
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
        var supabase = scope.ServiceProvider.GetRequiredService<Supabase.Client>();

        _logger.LogInformation("🔍 [WORKER] Buscando propiedad {PropiedadId} en la BD...", propiedadId);

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
            _logger.LogWarning("⚠️ [WORKER] Propiedad {PropiedadId} NO encontrada en la BD. Abortando.", propiedadId);
            return;
        }

        try
        {
            _logger.LogInformation("⬇️ [WORKER] Descargando imágenes de Supabase para {PropiedadId}...", propiedadId);
            
            var imagenPrincipal = !string.IsNullOrEmpty(propiedad.Media.FirstOrDefault(m => m.EsPrincipal)?.UrlPublica)
                ? await DownloadImageAsync(propiedad.Media.First(m => m.EsPrincipal).UrlPublica, ct)
                : null;

            byte[]? agenteLogo = null;
            if (!string.IsNullOrEmpty(propiedad.Agente?.LogoUrl))
            {
                _logger.LogInformation("🎨 [WORKER] Intentando descargar logo del agente: {Url}", propiedad.Agente.LogoUrl);
                agenteLogo = await DownloadImageAsync(propiedad.Agente.LogoUrl, ct);
                
                if (agenteLogo == null)
                    _logger.LogWarning("⚠️ [WORKER] No se pudo descargar el logo desde la URL proporcionada.");
                else
                    _logger.LogInformation("✅ [WORKER] Logo descargado correctamente ({Size} bytes).", agenteLogo.Length);
            }
            else
            {
                _logger.LogInformation("ℹ️ [WORKER] El agente no tiene logo configurado.");
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

            _logger.LogInformation("📄 [WORKER] Imágenes descargadas. Ensamblando plantilla PDF con QuestPDF...");
            
            var data = new FichaPdfData(
                propiedad.Titulo, propiedad.Descripcion, propiedad.TipoPropiedad,
                propiedad.Operacion, propiedad.Precio, $"{propiedad.Direccion}, {propiedad.Sector}, {propiedad.Ciudad}",
                propiedad.Habitaciones, propiedad.Banos, propiedad.AreaTotal, imagenPrincipal,
                $"{propiedad.Agente?.Nombre ?? "Agente"} {propiedad.Agente?.Apellido ?? ""}".Trim(), 
                $"{propiedad.Agente?.Email ?? ""} | {propiedad.Agente?.Telefono ?? ""}".Trim(' ', '|'),
                propiedad.Agente?.Agencia?.Nombre, agenteLogo, seccionesData
            );

            var document = new PropiedadFichaDocument(data);
            QuestPDF.Settings.EnableDebugging = true;
            var pdfBytes = document.GeneratePdf();

            _logger.LogInformation("☁️ [WORKER] PDF ensamblado ({Size} bytes). Subiendo a Supabase Storage...", pdfBytes.Length);

            var fileName = $"ficha_{propiedadId}.pdf";
            var bucket = supabase.Storage.From("propiedades");
            
            // Subimos con cabeceras para matar la caché (Cache-Control: max-age=0)
            // Esto asegura que el navegador y el CDN siempre pidan la versión nueva.
            await bucket.Upload(pdfBytes, fileName, new Supabase.Storage.FileOptions 
            { 
                Upsert = true,
                ContentType = "application/pdf",
                CacheControl = "0"
            });
            
            _logger.LogInformation("✅ [WORKER] ÉXITO: PDF generado y subido correctamente como {FileName}", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [WORKER] Error crítico durante el proceso del PDF para {PropiedadId}", propiedadId);
        }
    }

    private async Task<byte[]?> DownloadImageAsync(string url, CancellationToken ct)
    {
        try 
        { 
            var client = _httpClientFactory.CreateClient();
            return await client.GetByteArrayAsync(url, ct); 
        }
        catch { return null; }
    }
}
