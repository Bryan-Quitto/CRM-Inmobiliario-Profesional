using System.Text.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services.Tools;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Features.AgentAi.Tools;

public sealed class NavegacionDirectaHandler : BaseCoreAiToolHandler
{
    public NavegacionDirectaHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger<NavegacionDirectaHandler> logger) 
        : base(dbContextFactory, logger) { }

    public override string ToolName => "NavegacionDirecta";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        string destino = ExtractSafeString(args.RootElement, "destino", 200, string.Empty);

        if (string.IsNullOrWhiteSpace(destino))
        {
            return "Error: No se proporcionó un destino válido.";
        }

        // Emit the special token for the client SPA to intercept
        string responseToken = $"[SystemAction: RedirectTo={destino}]";

        return $"Redirigiendo al usuario. Se emitió el token de navegación: {responseToken}";
    }
}
