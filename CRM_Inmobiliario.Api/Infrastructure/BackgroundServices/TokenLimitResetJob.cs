using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace CRM_Inmobiliario.Api.Infrastructure.BackgroundServices;

public class TokenLimitResetJob
{
    private readonly CrmDbContext _context;
    private readonly ILogger<TokenLimitResetJob> _logger;

    public TokenLimitResetJob(CrmDbContext context, ILogger<TokenLimitResetJob> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task ResetDailyLimitsAsync()
    {
        var result = await _context.Contactos
            .Where(c => c.EstadoIA == "LimiteAlcanzado" && !c.BotActivo)
            .ExecuteUpdateAsync(s => s
                .SetProperty(c => c.BotActivo, true)
                .SetProperty(c => c.EstadoIA, (string?)null));

        if (result > 0)
        {
            _logger.LogInformation("Hangfire: Límite diario reseteado para {Count} contactos. Bots reactivados.", result);
        }
    }
}
