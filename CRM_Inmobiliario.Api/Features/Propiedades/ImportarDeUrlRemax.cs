using HtmlAgilityPack;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using System.Net.Http;

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
                
                var response = await client.GetAsync(request.Url);
                if (!response.IsSuccessStatusCode)
                {
                    return Results.BadRequest("No se pudo acceder a la página de Remax. HTTP " + response.StatusCode);
                }

                var html = await response.Content.ReadAsStringAsync();
                var htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(html);

                // Scraping Avanzado
                var titulo = htmlDoc.DocumentNode.SelectSingleNode("//h1")?.InnerText?.Trim() ?? string.Empty;
                
                var descripcion = "";
                var descHeader = htmlDoc.DocumentNode.SelectSingleNode("//h2[contains(text(), 'Descripción')] | //h3[contains(text(), 'Descripción')] | //h4[contains(text(), 'Descripción')]");
                
                if (descHeader != null)
                {
                    // Obtiene el primer elemento (después del header en el flujo de DOM) que contenga un texto sustancial (>40 caracteres)
                    var descTarget = descHeader.SelectSingleNode("following::*[string-length(normalize-space(text())) > 40][1]");
                    descripcion = descTarget?.InnerText?.Trim() ?? "";
                    
                    // Limpieza general
                    descripcion = Regex.Replace(descripcion, @"\n\s+", "\n");
                    descripcion = descripcion.Replace("Ver más +", "").Trim();
                }

                var priceText = htmlDoc.DocumentNode.SelectSingleNode("//*[contains(text(), 'USD')]")?.InnerText ?? "";
                decimal precio = 0;
                var matchPrice = Regex.Match(priceText, @"([\d.,]+)\s*USD");
                if (matchPrice.Success)
                {
                    var cleanPrice = matchPrice.Groups[1].Value.Replace(".", "").Replace(",", "");
                    decimal.TryParse(cleanPrice, out precio); 
                }

                string operacion = "Venta";
                if (titulo.Contains("alquiler", StringComparison.OrdinalIgnoreCase) || 
                    titulo.Contains("renta", StringComparison.OrdinalIgnoreCase) ||
                    request.Url.Contains("alquiler") || 
                    request.Url.Contains("renta"))
                {
                    operacion = "Alquiler";
                }

                string tipo = "Casa";
                if (titulo.Contains("departamento", StringComparison.OrdinalIgnoreCase)) tipo = "Departamento";
                else if (titulo.Contains("terreno", StringComparison.OrdinalIgnoreCase)) tipo = "Terreno";
                else if (titulo.Contains("oficina", StringComparison.OrdinalIgnoreCase)) tipo = "Oficina";
                else if (titulo.Contains("local", StringComparison.OrdinalIgnoreCase)) tipo = "Local Comercial";
                else if (titulo.Contains("suite", StringComparison.OrdinalIgnoreCase)) tipo = "Suite";

                int habitaciones = 0;
                decimal banos = 0;
                decimal area = 0;
                decimal? areaTerreno = null;
                decimal? areaConstruccion = null;
                int? estacionamientos = null;
                int? mediosBanos = null;
                int? aniosAntiguedad = null;
                string direccionCompleta = "";

                var innerText = htmlDoc.DocumentNode.InnerText;
                var habMatch = Regex.Match(innerText, @"(\d+)\s*(habitaciones|dormitorios|cuartos)", RegexOptions.IgnoreCase);
                if (habMatch.Success) int.TryParse(habMatch.Groups[1].Value, out habitaciones);

                var banosMatch = Regex.Match(innerText, @"(\d+)\s*(baños|bano|baño)\b", RegexOptions.IgnoreCase);
                if (banosMatch.Success && !banosMatch.Value.Contains("medio")) decimal.TryParse(banosMatch.Groups[1].Value, out banos);

                var areaMatch = Regex.Match(innerText, @"(\d+[\.,]?\d*)\s*(m([2²])? totales?)", RegexOptions.IgnoreCase);
                if (areaMatch.Success) decimal.TryParse(areaMatch.Groups[1].Value.Replace(",", "."), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out area);

                var terrMatch = Regex.Match(innerText, @"(\d+[\.,]?\d*)\s*(m([2²])?\s*terreno)", RegexOptions.IgnoreCase);
                if (terrMatch.Success) {
                    if (decimal.TryParse(terrMatch.Groups[1].Value.Replace(",", "."), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var t)) areaTerreno = t;
                }

                var constMatch = Regex.Match(innerText, @"(\d+[\.,]?\d*)\s*(m([2²])?\s*cubiertos?)", RegexOptions.IgnoreCase);
                if (constMatch.Success) {
                    if (decimal.TryParse(constMatch.Groups[1].Value.Replace(",", "."), System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var c)) areaConstruccion = c;
                }

                var parkMatch = Regex.Match(innerText, @"(\d+)\s*(parqueadero|estacionamiento|garaje)", RegexOptions.IgnoreCase);
                if (parkMatch.Success) {
                    if (int.TryParse(parkMatch.Groups[1].Value, out var pt)) estacionamientos = pt;
                }

                var midBathMatch = Regex.Match(innerText, @"(\d+)\s*(medio\s*baño|medios\s*baños)", RegexOptions.IgnoreCase);
                if (midBathMatch.Success) {
                    if (int.TryParse(midBathMatch.Groups[1].Value, out var mb)) mediosBanos = mb;
                }

                var antMatch = Regex.Match(innerText, @"(\d+)\s*(años?\s*antigüedad)", RegexOptions.IgnoreCase);
                if (antMatch.Success) {
                    if (int.TryParse(antMatch.Groups[1].Value, out var a)) aniosAntiguedad = a;
                }

                // Buscar encabezado formal de Ubicación (limitando largo para no escavar párrafos)
                var ubiHeader = htmlDoc.DocumentNode.SelectSingleNode("//*[contains(text(), 'Ubicación') and string-length(normalize-space(text())) < 40 and (name()='h2' or name()='h3' or name()='h4')]");
                
                if (ubiHeader != null)
                {
                    var sibling = ubiHeader.NextSibling;
                    while (sibling != null && string.IsNullOrWhiteSpace(sibling.InnerText))
                    {
                        sibling = sibling.NextSibling;
                    }
                    direccionCompleta = sibling?.InnerText?.Trim() ?? "";
                }
                else
                {
                    // Fallback: A veces la ubicación viene en el texto libre de la Descripción
                    var ubiFallbackMatch = Regex.Match(descripcion, @"(?i)ubicaci[oó]n:\s*(.+?)(?:\r|\n|$)");
                    if (ubiFallbackMatch.Success) 
                    {
                        direccionCompleta = ubiFallbackMatch.Groups[1].Value.Trim();
                    }
                }

                direccionCompleta = Regex.Replace(direccionCompleta, @"\s+", " ").Trim(); // colapsar espacios

                var scrapedData = new ImportarRemaxResponse(
                    Titulo: titulo,
                    Descripcion: descripcion,
                    TipoPropiedad: tipo,
                    Operacion: operacion,
                    Precio: precio,
                    Sector: "", 
                    Ciudad: "", 
                    Habitaciones: habitaciones,
                    Banos: banos,
                    AreaTotal: Math.Max(area, areaConstruccion ?? 0),
                    AreaTerreno: areaTerreno,
                    AreaConstruccion: areaConstruccion,
                    Estacionamientos: estacionamientos,
                    MediosBanos: mediosBanos,
                    AniosAntiguedad: aniosAntiguedad,
                    DireccionCompleta: direccionCompleta,
                    UrlRemax: request.Url
                );

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
