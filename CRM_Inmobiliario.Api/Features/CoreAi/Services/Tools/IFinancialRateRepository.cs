using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;

public interface IFinancialRateRepository
{
    Task<FinancialRate?> GetCurrentRatesAsync(CancellationToken cancellationToken = default);
}
