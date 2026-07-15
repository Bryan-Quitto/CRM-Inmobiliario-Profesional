using System.Collections.Concurrent;
using System.Threading.Channels;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public record PdfGenerationRequest(Guid PropiedadId, Guid AgenteId);

/// <summary>
/// Gestiona una cola de mensajes en memoria para procesar la generación de PDFs
/// de forma asíncrona y no bloqueante.
/// </summary>
public interface IPdfGeneratorQueue
{
    ValueTask QueuePdfGenerationAsync(PdfGenerationRequest request);
    ValueTask<PdfGenerationRequest> DequeuePdfGenerationAsync(CancellationToken cancellationToken);
    bool IsGenerating(Guid propiedadId, Guid agenteId);
    void SetStatus(Guid propiedadId, Guid agenteId, bool isGenerating);
}

public class PdfGeneratorQueue : IPdfGeneratorQueue
{
    private readonly Channel<PdfGenerationRequest> _queue;
    private readonly ConcurrentDictionary<string, bool> _status = new();

    public PdfGeneratorQueue()
    {
        _queue = Channel.CreateUnbounded<PdfGenerationRequest>(new UnboundedChannelOptions
        {
            SingleReader = true
        });
    }

    private string GetKey(Guid propiedadId, Guid agenteId) => $"{propiedadId}_{agenteId}";

    public async ValueTask QueuePdfGenerationAsync(PdfGenerationRequest request)
    {
        _status[GetKey(request.PropiedadId, request.AgenteId)] = true;
        await _queue.Writer.WriteAsync(request);
    }

    public async ValueTask<PdfGenerationRequest> DequeuePdfGenerationAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }

    public bool IsGenerating(Guid propiedadId, Guid agenteId)
    {
        return _status.TryGetValue(GetKey(propiedadId, agenteId), out var generating) && generating;
    }

    public void SetStatus(Guid propiedadId, Guid agenteId, bool isGenerating)
    {
        if (isGenerating)
            _status[GetKey(propiedadId, agenteId)] = true;
        else
            _status.TryRemove(GetKey(propiedadId, agenteId), out _);
    }
}
