using Microsoft.AspNetCore.OutputCaching;
using Microsoft.Extensions.Primitives;

namespace CRM_Inmobiliario.Api.Infrastructure.Caching;

/// <summary>
/// Política de OutputCache diseñada específicamente para sobreescribir el comportamiento por defecto de ASP.NET Core
/// que ignora peticiones autenticadas. Esta política permite el cacheo seguro de endpoints [Authorize] separando 
/// el caché obligatoriamente por el token de autorización (VaryByHeader).
/// </summary>
public sealed class AuthenticatedOutputCachePolicy : IOutputCachePolicy
{
    public ValueTask CacheRequestAsync(OutputCacheContext context, CancellationToken cancellationToken)
    {
        var attemptOutputCaching = HttpMethods.IsGet(context.HttpContext.Request.Method) || 
                                   HttpMethods.IsHead(context.HttpContext.Request.Method);
        
        if (attemptOutputCaching)
        {
            context.EnableOutputCaching = true;
            context.AllowCacheLookup = true;
            context.AllowCacheStorage = true;
            context.AllowLocking = true;
            
            // Obligatorio para asegurar que agentes diferentes no vean los datos cruzados
            context.CacheVaryByRules.HeaderNames = new StringValues(
                context.CacheVaryByRules.HeaderNames.Append("Authorization").ToArray()
            );
            
            // Variar por todos los query parameters
            context.CacheVaryByRules.QueryKeys = "*";
        }
        
        return ValueTask.CompletedTask;
    }

    public ValueTask ServeFromCacheAsync(OutputCacheContext context, CancellationToken cancellationToken) 
        => ValueTask.CompletedTask;

    public ValueTask ServeResponseAsync(OutputCacheContext context, CancellationToken cancellationToken) 
        => ValueTask.CompletedTask;
}
