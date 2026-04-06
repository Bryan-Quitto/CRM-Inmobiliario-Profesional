using System.Threading.Channels;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

/// <summary>
/// Gestiona la eliminación programada de archivos PDF (ej: 30 segundos después de la descarga).
/// </summary>
public interface IPdfCleanupQueue
{
    ValueTask QueueDeletionAsync(Guid propiedadId, TimeSpan delay);
    ValueTask<(Guid PropiedadId, DateTime DeletionTime)> DequeueDeletionAsync(CancellationToken ct);
}

public class PdfCleanupQueue : IPdfCleanupQueue
{
    private readonly Channel<(Guid PropiedadId, DateTime DeletionTime)> _queue;

    public PdfCleanupQueue()
    {
        _queue = Channel.CreateUnbounded<(Guid, DateTime)>(new UnboundedChannelOptions
        {
            SingleReader = true
        });
    }

    public async ValueTask QueueDeletionAsync(Guid propiedadId, TimeSpan delay)
    {
        await _queue.Writer.WriteAsync((propiedadId, DateTime.UtcNow.Add(delay)));
    }

    public async ValueTask<(Guid PropiedadId, DateTime DeletionTime)> DequeueDeletionAsync(CancellationToken ct)
    {
        return await _queue.Reader.ReadAsync(ct);
    }
}
