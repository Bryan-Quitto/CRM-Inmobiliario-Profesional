using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Google.GenAI.Types;

namespace CRM_Inmobiliario.Api.Features.AI.Services;

public interface IGeminiApiClient
{
    Task<bool> PatchTtlAsync(string geminiCacheId, string byokKey, CancellationToken cancellationToken = default);
    Task<string?> CreateCachedContentAsync(string byokKey, Content? systemInstruction, List<Content> contents, CancellationToken cancellationToken = default);
}
