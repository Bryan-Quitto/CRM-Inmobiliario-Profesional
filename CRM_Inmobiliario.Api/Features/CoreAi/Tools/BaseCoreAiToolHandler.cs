using System;
using System.Text.Json;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Domain.Entities;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using Microsoft.Extensions.Logging;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using Microsoft.EntityFrameworkCore;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Tools;

public abstract class BaseCoreAiToolHandler : ICoreAiToolHandler
{
    protected readonly Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> _dbContextFactory;
    protected readonly ILogger _logger;

    protected BaseCoreAiToolHandler(Microsoft.EntityFrameworkCore.IDbContextFactory<CrmDbContext> dbContextFactory, ILogger logger)
    {
        _dbContextFactory = dbContextFactory;
        _logger = logger;
    }

    public abstract string ToolName { get; }

    public abstract Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default);

    protected async Task LogAiActionAsync(string accion, string detalle, ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        var safeDetalle = detalle;
        if (detalle?.Length > 2000)
        {
            int len = 2000;
            if (char.IsHighSurrogate(detalle[len - 1])) len--;
            safeDetalle = detalle.Substring(0, len);
        }

        var log = new AiActionLog
        {
            Id = Guid.NewGuid(),
            TelefonoContacto = context.CustomerPhone ?? "N/A",
            ContactoId = context.ContactoId,
            Accion = accion,
            DetalleJson = safeDetalle,
            TriggerMessage = context.TriggerMessage,
            Fecha = DateTimeOffset.UtcNow
        };
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
        await dbContext.AiActionLogs.AddAsync(log, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    // --- RESOLUCIÓN DE IDENTIDAD UNIVERSAL ---
    protected async Task<Agent?> ResolveIdentityAsync(ToolExecutionContext context, System.Threading.CancellationToken cancellationToken = default)
    {
        await using var dbContext = await _dbContextFactory.CreateDbContextAsync(cancellationToken);

        if (context.Channel == "Copilot")
        {
            return await dbContext.Agents.FirstOrDefaultAsync(a => a.Id == context.UserId, cancellationToken);
        }
        else if (context.Channel == "Facebook" && !string.IsNullOrEmpty(context.PhoneNumberId))
        {
            return await dbContext.Agents.FirstOrDefaultAsync(a => a.FacebookPageId == context.PhoneNumberId, cancellationToken);
        }
        else if (!string.IsNullOrEmpty(context.PhoneNumberId))
        {
            return await dbContext.Agents.FirstOrDefaultAsync(a => a.WhatsAppPhoneNumberId == context.PhoneNumberId, cancellationToken);
        }

        return null;
    }

    // --- BARRERAS ANTI-ALUCINACIÓN (ESCUDO) ---

    protected string ExtractSafeString(JsonElement element, string propName, int maxLength = 500, string defaultValue = "")
    {
        if (element.TryGetProperty(propName, out var prop) && prop.ValueKind == JsonValueKind.String)
        {
            var raw = prop.GetString() ?? string.Empty;
            if (raw.Length > maxLength)
            {
                if (char.IsHighSurrogate(raw[maxLength - 1])) maxLength--;
                return raw.Substring(0, maxLength);
            }
            return raw;
        }
        return defaultValue;
    }

    protected bool TryExtractSafeDecimal(JsonElement element, string propName, out decimal value, out string error, decimal min = 0, decimal max = decimal.MaxValue)
    {
        value = 0;
        error = string.Empty;
        if (element.TryGetProperty(propName, out var prop) && prop.TryGetDecimal(out var dec))
        {
            if (dec < min || dec > max)
            {
                error = $"Error Crítico: El valor de '{propName}' ({dec}) está fuera del rango lógico permitido ({min} a {max}). Corrige tu parámetro.";
                return false;
            }
            value = dec;
            return true;
        }
        error = $"Error Crítico: El parámetro '{propName}' no es numérico o no tiene un formato válido.";
        return false;
    }

    protected bool TryExtractSafeFutureDate(JsonElement element, string propName, out DateTimeOffset date, out string error, int maxYearsInFuture = 2)
    {
        date = DateTimeOffset.MinValue;
        error = string.Empty;
        if (element.TryGetProperty(propName, out var prop) && prop.ValueKind == JsonValueKind.String)
        {
            if (DateTimeOffset.TryParse(prop.GetString(), out var parsed))
            {
                var minDate = DateTimeOffset.UtcNow.AddDays(-1);
                var maxDate = DateTimeOffset.UtcNow.AddYears(maxYearsInFuture);
                
                if (parsed < minDate || parsed > maxDate)
                {
                    error = $"Error Crítico: La fecha para '{propName}' ({parsed:yyyy-MM-dd}) es irreal o imposible. Debe estar entre hoy y {maxYearsInFuture} años en el futuro. Corrige tu parámetro.";
                    return false;
                }
                date = parsed;
                return true;
            }
        }
        error = $"Error Crítico: El parámetro '{propName}' no es una fecha válida o no fue proporcionado.";
        return false; 
    }

    protected TEnum ExtractSafeEnum<TEnum>(JsonElement element, string propName, TEnum defaultValue) where TEnum : struct
    {
        if (element.TryGetProperty(propName, out var prop) && prop.ValueKind == JsonValueKind.String)
        {
            var raw = prop.GetString() ?? string.Empty;
            if (Enum.TryParse<TEnum>(raw, true, out var parsed))
            {
                return parsed;
            }
        }
        return defaultValue;
    }
}



