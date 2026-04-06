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
}

public class PdfGeneratorQueue : IPdfGeneratorQueue
{
    private readonly Channel<Guid> _queue;

    public PdfGeneratorQueue()
    {
        // Unbounded channel para simplicidad, en sistemas masivos se podría usar Bounded
        _queue = Channel.CreateUnbounded<Guid>(new UnboundedChannelOptions
        {
            SingleReader = true // Solo nuestro BackgroundService leerá de aquí
        });
    }

    public async ValueTask QueuePdfGenerationAsync(Guid propiedadId)
    {
        await _queue.Writer.WriteAsync(propiedadId);
    }

    public async ValueTask<Guid> DequeuePdfGenerationAsync(CancellationToken cancellationToken)
    {
        return await _queue.Reader.ReadAsync(cancellationToken);
    }
}
