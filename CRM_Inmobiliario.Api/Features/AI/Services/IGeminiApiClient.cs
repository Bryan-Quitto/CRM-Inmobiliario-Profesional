using System.Threading;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.AI.Services;

public interface IGeminiApiClient
{
    Task<bool> PatchTtlAsync(string geminiCacheId, string byokKey, CancellationToken cancellationToken = default);
}
