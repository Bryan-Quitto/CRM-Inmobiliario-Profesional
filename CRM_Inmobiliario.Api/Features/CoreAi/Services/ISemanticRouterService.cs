using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Models;
using Microsoft.Extensions.AI;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Services;

public enum ChatIntent
{
    NUEVA_BUSQUEDA,
    CAMBIO_TEMA,
    CONTINUACION
}

public class SemanticRouterResponse
{
    public ChatIntent Intent { get; set; }
}

public interface ISemanticRouterService
{
    Task<ChatIntent> DetermineIntentAsync(IReadOnlyList<ChatMessage> history, CancellationToken cancellationToken = default);
}
