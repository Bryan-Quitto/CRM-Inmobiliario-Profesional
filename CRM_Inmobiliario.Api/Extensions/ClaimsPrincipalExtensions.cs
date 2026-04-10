using System.Security.Claims;

namespace CRM_Inmobiliario.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid? GetUserId(this ClaimsPrincipal user)
    {
        // Supabase usa el claim "sub" para el ID de usuario. 
        // .NET a veces lo mapea a ClaimTypes.NameIdentifier y otras lo deja como "sub".
        var idString = user.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? user.FindFirst("sub")?.Value 
                       ?? user.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier")?.Value;
        
        if (Guid.TryParse(idString, out var guid))
        {
            return guid;
        }
        
        return null;
    }
    
    public static Guid GetRequiredUserId(this ClaimsPrincipal user)
    {
        return user.GetUserId() ?? throw new UnauthorizedAccessException("El ID de usuario no se encuentra en el token.");
    }
}
