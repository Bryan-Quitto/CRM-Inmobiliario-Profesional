using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using System.Net.Http;
using System;

namespace CRM_Inmobiliario.Api.Features.Propiedades;

public static class ImportarDeUrlRemaxFeature
{
    public record ImportarRemaxRequest(string Url);

    public record ImportarRemaxResponse(
        string Titulo,
        string Descripcion,
        string TipoPropiedad,
        string Operacion,
        decimal Precio,
        string Sector,
        string Ciudad,
        int Habitaciones,
        decimal Banos,
        decimal AreaTotal,
        decimal? AreaTerreno,
        decimal? AreaConstruccion,
        int? Estacionamientos,
        int? MediosBanos,
        int? AniosAntiguedad,
        string DireccionCompleta,
        string UrlRemax
    );

    public static void MapImportarRemaxEndpoint(this IEndpointRouteBuilder app)
    {
        app.MapPost("/propiedades/importar-remax", async (ImportarRemaxRequest request, ClaimsPrincipal user, IHttpClientFactory httpClientFactory) =>
        {
            user.GetRequiredUserId(); // Autenticación
            
            if (string.IsNullOrWhiteSpace(request.Url) || !request.Url.Contains("remax.com.ec"))
            {
                return Results.BadRequest("Solo se permiten URLs válidas de remax.com.ec.");
            }

            try
            {
                var client = httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                
                // PROCESAMIENTO MODULAR (Extraído)
                var scrapedData = await RemaxScraperProcessor.ScrapeAsync(request.Url, client);

                return Results.Ok(scrapedData);
            }
            catch (Exception ex)
            {
                return Results.Problem("Ocurrió un error interno al extraer los datos: " + ex.Message);
            }
        })
        .WithTags("Propiedades")
        .WithName("ImportarRemax");
    }
}
