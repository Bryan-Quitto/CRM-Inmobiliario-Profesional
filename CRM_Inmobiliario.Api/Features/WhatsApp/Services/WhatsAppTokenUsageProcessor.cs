using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.WhatsApp.Services;

public interface IWhatsAppTokenUsageProcessor
{
    Task RecordTokenUsageAsync(Guid contactoId, int totalTokens, int inputTokens, int cachedTokens, int outputTokens, string provider = "OpenAI", CancellationToken cancellationToken = default);
}

public sealed class WhatsAppTokenUsageProcessor : IWhatsAppTokenUsageProcessor
{
    private readonly CrmDbContext _context;

    public WhatsAppTokenUsageProcessor(CrmDbContext context)
    {
        _context = context;
    }

    public async Task RecordTokenUsageAsync(Guid contactoId, int totalTokens, int inputTokens, int cachedTokens, int outputTokens, string provider = "OpenAI", CancellationToken cancellationToken = default)
    {
        var now = DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5));
        var targetDate = new DateTimeOffset(now.Year, now.Month, now.Day, 0, 0, 0, TimeSpan.FromHours(-5));
            
        decimal costoTransaccion = 0m;
        decimal ahorroTransaccion = 0m;

        if (provider.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
        {
            costoTransaccion = (inputTokens / 1_000_000m * 0.075m) + 
                               (cachedTokens / 1_000_000m * 0.01875m) + 
                               (outputTokens / 1_000_000m * 0.30m);
                               
            decimal costoSinCache = cachedTokens / 1_000_000m * 0.075m;
            decimal costoConCache = cachedTokens / 1_000_000m * 0.01875m;
            ahorroTransaccion = costoSinCache - costoConCache;
        }
        else // default to OpenAI or others
        {
            costoTransaccion = (inputTokens / 1_000_000m * 0.150m) + 
                               (outputTokens / 1_000_000m * 0.60m);
        }

        bool saved = false;
        while (!saved)
        {
            var usage = await _context.ContactDailyTokenUsages
                .FirstOrDefaultAsync(u => u.ContactoId == contactoId && u.Date == targetDate && u.Channel == "WhatsApp", cancellationToken);

            if (usage == null)
            {
                usage = new ContactDailyTokenUsage
                {
                    Id = Guid.NewGuid(),
                    ContactoId = contactoId,
                    Date = targetDate,
                    TokensUsed = totalTokens,
                    InputTokens = inputTokens,
                    CachedTokens = cachedTokens,
                    OutputTokens = outputTokens,
                    CostoUSD = costoTransaccion,
                    AhorroUSD = ahorroTransaccion,
                    Channel = "WhatsApp"
                };
                _context.ContactDailyTokenUsages.Add(usage);
            }
            else
            {
                usage.TokensUsed += totalTokens;
                usage.InputTokens += inputTokens;
                usage.CachedTokens += cachedTokens;
                usage.OutputTokens += outputTokens;
                usage.CostoUSD += costoTransaccion;
                usage.AhorroUSD += ahorroTransaccion;
            }
            
            try
            {
                await _context.SaveChangesAsync(cancellationToken);
                saved = true;
            }
            catch (DbUpdateException)
            {
                _context.Entry(usage).State = EntityState.Detached;
            }
        }
    }
}
