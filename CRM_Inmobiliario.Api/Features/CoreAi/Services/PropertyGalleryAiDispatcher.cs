using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;
using CRM_Inmobiliario.Api.Features.WhatsApp.Services;
using CRM_Inmobiliario.Api.Features.Facebook.Services;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Services;

public interface IPropertyGalleryAiDispatcher
{
    Task<string> DispatchGalleryAsync(string channel, Guid propiedadId, string nombreSeccion, bool enviarTodas, int offset, string phone, string? channelAccessToken, Guid? contactoId, CancellationToken cancellationToken);
}

public sealed class PropertyGalleryAiDispatcher : IPropertyGalleryAiDispatcher
{
    private readonly CrmDbContext _dbContext;
    private readonly IWhatsAppMessageSender _whatsAppSender;
    private readonly IFacebookMessageSender _facebookSender;

    public PropertyGalleryAiDispatcher(CrmDbContext dbContext, IWhatsAppMessageSender whatsAppSender, IFacebookMessageSender facebookSender)
    {
        _dbContext = dbContext;
        _whatsAppSender = whatsAppSender;
        _facebookSender = facebookSender;
    }

    public async Task<string> DispatchGalleryAsync(string channel, Guid propiedadId, string nombreSeccion, bool enviarTodas, int offset, string phone, string? channelAccessToken, Guid? contactoId, CancellationToken cancellationToken)
    {
        var mediaQuery = _dbContext.PropertyMedia
            .Include(m => m.Section)
            .Where(m => m.PropiedadId == propiedadId && 
                        m.SectionId != null && 
                        m.Section!.Nombre.ToLower() == nombreSeccion.ToLower() &&
                        m.TipoMultimedia == "Image");

        int totalCount = await mediaQuery.CountAsync(cancellationToken);

        if (totalCount == 0)
        {
            return $"No se encontraron fotos para la sección '{nombreSeccion}'.";
        }

        var items = await mediaQuery
            .OrderBy(m => m.Orden)
            .Skip(offset)
            .Take(7)
            .ToListAsync(cancellationToken);

        if (!items.Any())
        {
            return $"No hay más fotos en la sección '{nombreSeccion}' (offset {offset} superó el total de {totalCount}).";
        }

        string sectionDescription = items.FirstOrDefault()?.Section?.Descripcion ?? string.Empty;
        string persuasionText = !string.IsNullOrWhiteSpace(sectionDescription)
            ? $"\nDescripción Comercial de la sección: {sectionDescription}"
            : "";

        if (!enviarTodas)
        {
            var summary = $"Se encontraron {totalCount} fotos en '{nombreSeccion}'. Mostrando {items.Count} desde el offset {offset}:\n";
            for (int i = 0; i < items.Count; i++)
            {
                summary += $"- Foto {offset + i + 1}: {items[i].Descripcion ?? "Sin descripción"}\n";
            }
            summary += $"\nQuedan {Math.Max(0, totalCount - (offset + items.Count))} fotos. Si el usuario pide enviarlas, llama la herramienta con EnviarTodas=true y el mismo offset.";
            summary += persuasionText;
            return summary;
        }

        int successCount = 0;
        foreach (var item in items)
        {
            try
            {
                if (channel == "Facebook")
                {
                    await _facebookSender.SendImageMessageAsync(
                        recipientPsid: phone,
                        imageUrl: item.UrlPublica,
                        pageAccessToken: channelAccessToken,
                        isAiResponse: true,
                        contactoId: contactoId,
                        agenteId: null,
                        cancellationToken: cancellationToken
                    );
                }
                else
                {
                    await _whatsAppSender.SendImageMessageAsync(
                        to: phone,
                        imageUrl: item.UrlPublica,
                        caption: item.Descripcion ?? "",
                        phoneNumberId: channelAccessToken,
                        isAiResponse: true,
                        contactoId: contactoId,
                        cancellationToken: cancellationToken
                    );
                }
                
                successCount++;
                // Small delay to prevent rate limit issues
                await Task.Delay(200, cancellationToken);
            }
            catch
            {
                // Ignore individual send failures and continue
            }
        }

        int remaining = Math.Max(0, totalCount - (offset + items.Count));
        string finalReturn = $"Se han enviado {successCount} fotos exitosamente al usuario (de las {items.Count} procesadas en este lote). Quedan {remaining} fotos en la sección. Para enviar más, aumenta el offset a {offset + items.Count}.";
        
        if (!string.IsNullOrWhiteSpace(persuasionText))
        {
            finalReturn += $"{persuasionText}\nIMPORTANTE: Redacta un mensaje al cliente comentándole estos detalles de forma atractiva y persuasiva justo ahora.";
        }
        
        return finalReturn;
    }
}
