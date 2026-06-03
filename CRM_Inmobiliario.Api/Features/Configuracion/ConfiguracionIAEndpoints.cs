using System.Security.Claims;
using CRM_Inmobiliario.Api.Extensions;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Json;
using Hangfire;

namespace CRM_Inmobiliario.Api.Features.Configuracion;

public static class ConfiguracionIAEndpoints
{
    public record IASettingsResponse(
        string? AiApiKey,
        string? WhatsAppPhoneNumberId,
        int DailyTokenLimitPerContact);

    public record UpdateIASettingsRequest(
        int? DailyTokenLimitPerContact,
        string? AiApiKey,
        string? WhatsAppPhoneNumberId);

    public record ValidateIASettingsRequest(
        string? AiApiKey,
        string? WhatsAppPhoneNumberId);

    public static IEndpointRouteBuilder MapConfiguracionIAEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/configuracion/ia-settings", async (ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            var settings = await context.Agents
                .AsNoTracking()
                .Where(a => a.Id == agenteId)
                .Select(a => new IASettingsResponse(
                    a.AiApiKey,
                    a.WhatsAppPhoneNumberId,
                    a.DailyTokenLimitPerContact))
                .FirstOrDefaultAsync();

            if (settings is null)
            {
                return Results.NotFound(new { Message = "Agente no encontrado." });
            }

            return Results.Ok(settings);
        })
        .WithTags("Configuracion")
        .WithName("ObtenerConfiguracionIA");

        endpoints.MapPut("/configuracion/ia-settings", async (
            UpdateIASettingsRequest request, 
            ClaimsPrincipal user, 
            CrmDbContext context, 
            System.Net.Http.IHttpClientFactory httpClientFactory,
            Hangfire.IBackgroundJobClient backgroundJobs) =>
        {
            if (request.DailyTokenLimitPerContact.HasValue && (request.DailyTokenLimitPerContact < 20000 || request.DailyTokenLimitPerContact > 1000000))
            {
                return Results.BadRequest(new { Message = "El límite de tokens debe estar entre 20,000 y 1,000,000." });
            }

            var agenteId = user.GetRequiredUserId();
            var agente = await context.Agents.FindAsync(agenteId);
            string? oldProvider = agente?.ActiveLLMProvider;

            if (agente is null)
            {
                return Results.NotFound(new { Message = "Agente no encontrado." });
            }

            if (!string.IsNullOrWhiteSpace(request.AiApiKey) && await context.Agents.AnyAsync(a => a.Id != agenteId && a.AiApiKey == request.AiApiKey))
            {
                return Results.BadRequest(new { Message = "La API Key ingresada ya está en uso por otro agente. Si el error persiste contacte con administración." });
            }

            if (!string.IsNullOrWhiteSpace(request.WhatsAppPhoneNumberId) && await context.Agents.AnyAsync(a => a.Id != agenteId && a.WhatsAppPhoneNumberId == request.WhatsAppPhoneNumberId))
            {
                return Results.BadRequest(new { Message = "El WhatsApp Phone ID ingresado ya está en uso por otro agente. Si el error persiste contacte con administración." });
            }

            if (request.DailyTokenLimitPerContact.HasValue)
            {
                agente.DailyTokenLimitPerContact = request.DailyTokenLimitPerContact.Value;
            }

            if (request.AiApiKey != null)
            {
                var newKey = string.IsNullOrWhiteSpace(request.AiApiKey) ? null : request.AiApiKey.Trim();
                
                if (!string.IsNullOrEmpty(newKey))
                {
                    bool isGemini = newKey.StartsWith("AIza", StringComparison.OrdinalIgnoreCase) || newKey.StartsWith("AQ.", StringComparison.OrdinalIgnoreCase);
                    bool isOpenAI = newKey.StartsWith("sk-", StringComparison.OrdinalIgnoreCase);

                    var client = httpClientFactory.CreateClient();
                    System.Net.Http.HttpResponseMessage? testRes = null;

                    if (isGemini)
                    {
                        var body = new { contents = new[] { new { parts = new[] { new { text = "hi" } } } } };
                        testRes = await client.PostAsJsonAsync($"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={newKey}", body);
                    }
                    else if (isOpenAI)
                    {
                        client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", newKey);
                        var body = new { model = "gpt-4o-mini", messages = new[] { new { role = "user", content = "hi" } }, max_tokens = 1 };
                        testRes = await client.PostAsJsonAsync("https://api.openai.com/v1/chat/completions", body);
                    }

                    if (testRes != null)
                    {
                        // Permitimos código 429 porque indica que la llave existe y es válida,
                        // aunque no tenga saldo o haya llegado a su límite gratuito (Free Tier).
                        if (!testRes.IsSuccessStatusCode && (int)testRes.StatusCode != 429)
                        {
                            return Results.BadRequest(new { Message = "La API Key no es válida. Por favor revísela." });
                        }
                    }

                    agente.AiApiKey = newKey;
                    agente.ActiveLLMProvider = isGemini ? "Gemini" : (isOpenAI ? "OpenAI" : null);
                }
                else
                {
                    agente.AiApiKey = null;
                    agente.ActiveLLMProvider = null;
                }
            }

            if (request.WhatsAppPhoneNumberId != null)
            {
                agente.WhatsAppPhoneNumberId = string.IsNullOrWhiteSpace(request.WhatsAppPhoneNumberId) ? null : request.WhatsAppPhoneNumberId;
            }

            await context.SaveChangesAsync();

            if (oldProvider != agente.ActiveLLMProvider)
            {
                backgroundJobs.Enqueue<CRM_Inmobiliario.Api.Features.Admin.Jobs.BulkVectorizationJob>(j => j.ProcessBulkAsync(false));
            }

            return Results.Ok(new { Message = "Configuración actualizada exitosamente." });
        })
        .WithTags("Configuracion")
        .WithName("ActualizarConfiguracionIA");

        endpoints.MapPost("/configuracion/ia-settings/validate", async (ValidateIASettingsRequest request, ClaimsPrincipal user, CrmDbContext context) =>
        {
            var agenteId = user.GetRequiredUserId();
            
            bool aiKeyInUse = false;
            if (!string.IsNullOrWhiteSpace(request.AiApiKey))
            {
                aiKeyInUse = await context.Agents.AnyAsync(a => a.Id != agenteId && a.AiApiKey == request.AiApiKey);
            }

            bool waIdInUse = false;
            if (!string.IsNullOrWhiteSpace(request.WhatsAppPhoneNumberId))
            {
                waIdInUse = await context.Agents.AnyAsync(a => a.Id != agenteId && a.WhatsAppPhoneNumberId == request.WhatsAppPhoneNumberId);
            }

            return Results.Ok(new { AiKeyInUse = aiKeyInUse, WaIdInUse = waIdInUse });
        })
        .WithTags("Configuracion")
        .WithName("ValidarConfiguracionIA");

        return endpoints;
    }
}
