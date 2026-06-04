using System.Text.Json;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;

public interface ICoreAiToolHandler
{
    string ToolName { get; }
    Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context);
}
