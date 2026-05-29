using System.Threading;
using System.Threading.Tasks;

namespace CRM_Inmobiliario.Api.Features.AI.Services;

public interface ICacheRenewalProcessor
{
    Task ProcessRenewalsAsync(CancellationToken cancellationToken);
}
