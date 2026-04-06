using System.Collections.Concurrent;
using System.Threading.Channels;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

/// <summary>
/// Gestiona una cola de mensajes en memoria para procesar la generación de PDFs
/// de forma asíncrona y no bloqueante.
/// </summary>
public interface IPdfGeneratorQueue
{
    ValueTask QueuePdfGenerationAsync(Guid propiedadId);
    ValueTask<Guid> DequeuePdfGenerationAsync(CancellationToken cancellationToken);
    bool IsGenerating(Guid propiedadId);
    void SetStatus(Guid propiedadId, bool isGenerating);
}

public class PdfGeneratorQueue : IPdfGeneratorQueue
{
    private readonly Channel<Guid> _queue;
    private readonly ConcurrentDictionary<Guid, bool> _status = new();

    public PdfGeneratorQueue()
    {
        _queue = Channel.CreateUnbounded<Guid>(new UnboundedChannelOptions
        {
            SingleReader = true
        });
    }

    public async ValueTask QueuePdfGenerationAsync(Guid propiedadId)
    {
        _status[propiedadId] = true;
        await _queue.Writer.WriteAsync(propiedadId);
    }

    public async ValueTask<Guid> DequeuePdfGenerationAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }

    public bool IsGenerating(Guid propiedadId)
    {
        return _status.TryGetValue(propiedadId, out var generating) && generating;
    }

    public void SetStatus(Guid propiedadId, bool isGenerating)
    {
        if (isGenerating)
            _status[propiedadId] = true;
        else
            _status.TryRemove(propiedadId, out _);
    }
}
