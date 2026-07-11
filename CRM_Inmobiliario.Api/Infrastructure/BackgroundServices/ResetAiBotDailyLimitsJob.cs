using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class ResetAiBotDailyLimitsJob
{
    private readonly CrmDbContext _context;
    private readonly ILogger<ResetAiBotDailyLimitsJob> _logger;

    public ResetAiBotDailyLimitsJob(CrmDbContext context, ILogger<ResetAiBotDailyLimitsJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ResetDailyLimitsAsync()
    {
        var resultWA = await _context.Contactos
            .Where(c => c.EstadoIA_WA == "LimiteAlcanzado" && !c.BotActivoWA)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.BotActivoWA, true)
                .SetProperty(c => c.EstadoIA_WA, (string?)null));

        var resultFB = await _context.Contactos
            .Where(c => c.EstadoIA_FB == "LimiteAlcanzado" && !c.BotActivoFB)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.BotActivoFB, true)
                .SetProperty(c => c.EstadoIA_FB, (string?)null));

    }
}
