using System.Security.Claims;
using System.Net.Http.Json;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.Facebook;

public static class FacebookOAuthEndpoints
{
    public record ExchangeTokenRequest(string ShortLivedToken);
    public record SavePageRequest(string PageId, string PageName, string PageAccessToken);
    // Nombres en PascalCase que ASP.NET serializa a camelCase: pageId, pageName, pageAccessToken, category
    public record FacebookPageDto(string PageId, string PageName, string PageAccessToken, string Category);
    public record ExchangeTokenResponse(IEnumerable<FacebookPageDto> Pages);

    public static IEndpointRouteBuilder MapFacebookOAuthEndpoints(this IEndpointRouteBuilder endpoints)
    {
        // POST: Intercambia el short-lived user token por long-lived y devuelve las páginas del usuario
        endpoints.MapPost("/configuracion/facebook/connect", async (
            ExchangeTokenRequest request,
            ClaimsPrincipal user,
            IHttpClientFactory httpClientFactory) =>
        {
            var appId = Environment.GetEnvironmentVariable("FACEBOOK_APP_ID");
            var appSecret = Environment.GetEnvironmentVariable("FACEBOOK_APP_SECRET");

            if (string.IsNullOrEmpty(appId) || string.IsNullOrEmpty(appSecret))
                return Results.StatusCode(500);

            var client = httpClientFactory.CreateClient();

            // Paso 1: Intercambiar token corto por token largo (60 días)
            var exchangeUrl = $"https://graph.facebook.com/v21.0/oauth/access_token" +
                $"?grant_type=fb_exchange_token" +
                $"&client_id={appId}" +
                $"&client_secret={appSecret}" +
                $"&fb_exchange_token={request.ShortLivedToken}";

            var exchangeRes = await client.GetAsync(exchangeUrl);
            if (!exchangeRes.IsSuccessStatusCode)
                return Results.BadRequest(new { Message = "No se pudo intercambiar el token. Verifique que el token sea válido." });

            var exchangeData = await exchangeRes.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            if (!exchangeData.TryGetProperty("access_token", out var longLivedTokenProp))
                return Results.BadRequest(new { Message = "Respuesta inesperada de Facebook al intercambiar el token." });

            var longLivedToken = longLivedTokenProp.GetString() ?? string.Empty;

            // Paso 2: Obtener lista de páginas administradas por el usuario
            var accountsUrl = $"https://graph.facebook.com/v21.0/me/accounts?access_token={longLivedToken}";
            var accountsRes = await client.GetAsync(accountsUrl);
            if (!accountsRes.IsSuccessStatusCode)
                return Results.BadRequest(new { Message = "No se pudo obtener la lista de páginas de Facebook." });

            var accountsData = await accountsRes.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
            if (!accountsData.TryGetProperty("data", out var dataArray))
                return Results.Ok(new ExchangeTokenResponse(Enumerable.Empty<FacebookPageDto>()));

            var pages = dataArray.EnumerateArray()
                .Where(p => p.TryGetProperty("id", out _) && p.TryGetProperty("name", out _) && p.TryGetProperty("access_token", out _))
                .Select(p => new FacebookPageDto(
                    p.GetProperty("id").GetString() ?? string.Empty,
                    p.GetProperty("name").GetString() ?? string.Empty,
                    p.GetProperty("access_token").GetString() ?? string.Empty,
                    p.TryGetProperty("category", out var cat) ? cat.GetString() ?? string.Empty : string.Empty))
                .ToList();

            return Results.Ok(new ExchangeTokenResponse(pages));
        })
        .WithTags("Facebook")
        .WithName("ConectarFacebookOAuth");

        // POST: Guarda la página seleccionada por el agente en la BD
        endpoints.MapPost("/configuracion/facebook/save-page", async (
            SavePageRequest request,
            ClaimsPrincipal user,
            CrmDbContext context,
            IHttpClientFactory httpClientFactory) =>
        {
            if (string.IsNullOrWhiteSpace(request.PageId))
                return Results.BadRequest(new { Message = "El ID de página es requerido." });

            // Unicidad: un PageId no puede estar asignado a dos agentes a la vez
            var agenteId = user.GetRequiredUserId();
            var pageIdEnUso = await context.Agents
                .AnyAsync(a => a.Id != agenteId && a.FacebookPageId == request.PageId);

            if (pageIdEnUso)
                return Results.BadRequest(new { Message = "Esta página de Facebook ya está vinculada a otro agente." });

            var agente = await context.Agents.FindAsync(agenteId);
            if (agente is null) return Results.NotFound(new { Message = "Agente no encontrado." });

            // Paso 3: Suscribir la App a los Webhooks de la página (messages, messaging_postbacks)
            var client = httpClientFactory.CreateClient();
            var subscribeUrl = $"https://graph.facebook.com/v21.0/{request.PageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks&access_token={request.PageAccessToken}";
            var subscribeRes = await client.PostAsync(subscribeUrl, null);
            if (!subscribeRes.IsSuccessStatusCode)
            {
                return Results.BadRequest(new { Message = "No se pudo suscribir el Webhook a la página de Facebook. Asegúrate de tener los permisos correctos en tu App de Meta." });
            }

            agente.FacebookPageId = request.PageId;
            agente.FacebookPageName = request.PageName;
            agente.FacebookPageAccessToken = request.PageAccessToken;
            await context.SaveChangesAsync();

            return Results.Ok(new { Message = "Página de Facebook vinculada exitosamente." });
        })
        .WithTags("Facebook")
        .WithName("GuardarPaginaFacebook");

        // DELETE: Desvincula la página de Facebook del agente
        endpoints.MapDelete("/configuracion/facebook/disconnect", async (
            ClaimsPrincipal user,
            CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var agente = await context.Agents.FindAsync(agenteId);
            if (agente is null) return Results.NotFound(new { Message = "Agente no encontrado." });

            agente.FacebookPageId = null;
            agente.FacebookPageName = null;
            agente.FacebookPageAccessToken = null;
            agente.IsFacebookAiEnabled = false;
            await context.SaveChangesAsync();

            return Results.Ok(new { Message = "Página de Facebook desvinculada exitosamente." });
        })
        .WithTags("Facebook")
        .WithName("DesconectarFacebook");

        return endpoints;
    }
}
