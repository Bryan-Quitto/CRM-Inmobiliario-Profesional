using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;

public class FinancialRateRepository : IFinancialRateRepository
{
    private readonly CrmDbContext _dbContext;

    public FinancialRateRepository(CrmDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<FinancialRate?> GetCurrentRatesAsync(CancellationToken cancellationToken = default)
    {
        // One trip pattern: get the first rate
        return await _dbContext.FinancialRates.FirstOrDefaultAsync(cancellationToken);
    }
}
