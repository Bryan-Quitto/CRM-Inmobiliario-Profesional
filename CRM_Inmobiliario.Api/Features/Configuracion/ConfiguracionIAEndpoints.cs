using Microsoft.AspNetCore.Routing;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ConfiguracionIAEndpoints
{
    public static IEndpointRouteBuilder MapConfiguracionIAEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapObtenerConfiguracionIA();
        endpoints.MapActualizarConfiguracionIA();
        endpoints.MapValidarConfiguracionIA();
        endpoints.MapReiniciarTokensIA();

        return endpoints;
    }
}
