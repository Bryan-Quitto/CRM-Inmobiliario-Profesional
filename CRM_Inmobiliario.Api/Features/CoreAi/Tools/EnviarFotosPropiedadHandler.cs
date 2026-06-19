using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using CRM_Inmobiliario.Api.Features.CoreAi.Services.Tools;
using CRM_Inmobiliario.Api.Features.CoreAi.Services;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using CRM_Inmobiliario.Api.Infrastructure.Persistence;

namespace CRM_Inmobiliario.Api.Features.CoreAi.Tools;

public sealed class EnviarFotosPropiedadHandler : BaseCoreAiToolHandler
{
    private readonly IPropertyGalleryAiDispatcher _dispatcher;

    public EnviarFotosPropiedadHandler(
        IDbContextFactory<CrmDbContext> dbContextFactory,
        IPropertyGalleryAiDispatcher dispatcher, 
        ILogger<EnviarFotosPropiedadHandler> logger) 
        : base(dbContextFactory, logger)
    {
        _dispatcher = dispatcher;
    }

    public override string ToolName => "EnviarFotosSeccionPropiedad";

    public override async Task<string> ExecuteAsync(JsonDocument args, ToolExecutionContext context, CancellationToken cancellationToken = default)
    {
        var root = args.RootElement;
        
        if (!root.TryGetProperty("propiedadId", out var propIdEl) || !Guid.TryParse(propIdEl.GetString(), out var propiedadId))
        {
            return "Error: propiedadId es requerido y debe ser un Guid válido.";
        }

        if (!root.TryGetProperty("nombreSeccion", out var nombreSeccionEl) || string.IsNullOrWhiteSpace(nombreSeccionEl.GetString()))
        {
            return "Error: nombreSeccion es requerido.";
        }

        bool enviarTodas = root.TryGetProperty("enviarTodas", out var enviarTodasEl) && enviarTodasEl.GetBoolean();
        int offset = root.TryGetProperty("offset", out var offsetEl) && offsetEl.TryGetInt32(out var off) ? off : 0;

        string nombreSeccion = nombreSeccionEl.GetString()!;

        _logger.LogInformation("Ejecutando EnviarFotosSeccionPropiedad para propiedad {PropiedadId}, sección {Seccion}, enviarTodas={EnviarTodas}, offset={Offset}",
            propiedadId, nombreSeccion, enviarTodas, offset);

        if (string.IsNullOrEmpty(context.ChannelIdentifier))
        {
            return "Error: No se pudo obtener el identificador del canal (número de teléfono) para enviar las fotos.";
        }

        return await _dispatcher.DispatchGalleryAsync(
            channel: context.Channel ?? "WhatsApp",
            propiedadId: propiedadId,
            nombreSeccion: nombreSeccion,
            enviarTodas: enviarTodas,
            offset: offset,
            phone: context.ChannelIdentifier,
            channelAccessToken: context.PhoneNumberId,
            contactoId: context.ContactoId,
            cancellationToken: cancellationToken);
    }
}
