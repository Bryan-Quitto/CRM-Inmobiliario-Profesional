using System.Text.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Tools;

public sealed class NavegacionDirectaHandler : ICoreAiToolHandler
{
    public string ToolName => "NavegacionDirecta";

    public Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context)
    {
        string? destino = null;

        if (args.RootElement.TryGetProperty("destino", out var destProp) && destProp.ValueKind == JsonValueKind.String)
        {
            destino = destProp.GetString();
        }

        if (string.IsNullOrWhiteSpace(destino))
        {
            return Task.FromResult("Error: No se proporcionó un destino válido.");
        }

        // Emit the special token for the client SPA to intercept
        string responseToken = $"[SystemAction: RedirectTo={destino}]";

        return Task.FromResult($"Redirigiendo al usuario. Se emitió el token de navegación: {responseToken}");
    }
}
