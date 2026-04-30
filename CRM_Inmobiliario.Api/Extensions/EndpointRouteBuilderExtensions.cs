using CRM_Inmobiliario.Api.Features.Analitica;
using CRM_Inmobiliario.Api.Features.Calendario;
using CRM_Inmobiliario.Api.Features.Clientes;
using CRM_Inmobiliario.Api.Features.Configuracion;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Features.Interacciones;
using CRM_Inmobiliario.Api.Features.Intereses;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Features.SeccionesGaleria;
using CRM_Inmobiliario.Api.Features.Tareas;
using CRM_Inmobiliario.Api.Features.WhatsApp;

namespace CRM_Inmobiliario.Api.Extensions;

public static class EndpointRouteBuilderExtensions
{
    public static void MapProjectEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var apiGroup = endpoints.MapGroup("/api").RequireAuthorization();

        // Clientes
        apiGroup.MapRegistrarClienteEndpoint();
        apiGroup.MapBuscarClientesEndpoint();
        apiGroup.MapListarClientesEndpoint().CacheOutput();
        apiGroup.MapObtenerClientePorIdEndpoint();
        apiGroup.MapActualizarClienteEndpoint();
        apiGroup.MapEliminarCliente();
        apiGroup.MapCambiarEtapaClienteEndpoint();
        apiGroup.MapRevertirEstadoClienteEndpoint();

        // Propiedades
        apiGroup.MapRegistrarPropiedadEndpoint();
        apiGroup.MapBuscarPropiedadesEndpoint();
        apiGroup.MapListarPropiedadesEndpoint().CacheOutput(p => p.Tag("properties-data"));
        apiGroup.MapObtenerPropiedadPorIdEndpoint();
        apiGroup.MapActualizarPropiedadEndpoint();
        apiGroup.MapCambiarEstadoPropiedadEndpoint();
        apiGroup.MapEliminarImagenPropiedadEndpoint();
        apiGroup.MapSubirImagenPropiedadEndpoint();
        apiGroup.MapEliminarTodasLasImagenesEndpoint();
        apiGroup.MapEstablecerImagenPrincipalEndpoint();
        apiGroup.MapLimpiarImagenesPropiedadEndpoint();
        apiGroup.MapEliminarImagenesSeleccionadasEndpoint();
        apiGroup.MapImportarRemaxEndpoint();
        apiGroup.MapVolverAListarPropiedadEndpoint();
        apiGroup.MapObtenerHistorialPropiedadEndpoint();
        apiGroup.MapActualizarTransaccionEndpoint();
        apiGroup.MapEliminarTransaccionEndpoint();

        // Tareas
        apiGroup.MapRegistrarTareaEndpoint();
        apiGroup.MapListarTareasEndpoint().CacheOutput();
        apiGroup.MapObtenerTareaPorIdEndpoint();
        apiGroup.MapActualizarTareaEndpoint();
        apiGroup.MapCompletarTareaEndpoint();
        apiGroup.MapCancelarTareaEndpoint();

        // Secciones de Galería
        apiGroup.MapRegistrarSeccionEndpoint();
        apiGroup.MapActualizarSeccionEndpoint();
        apiGroup.MapEliminarSeccionEndpoint();
        apiGroup.MapReordenarSeccionesEndpoint();
        apiGroup.MapActualizarDescripcionMultimediaEndpoint();

        // Interacciones
        apiGroup.MapRegistrarInteraccionEndpoint();
        apiGroup.MapActualizarInteraccionEndpoint();
        apiGroup.MapEliminarInteraccionEndpoint();

        // Intereses
        apiGroup.MapVincularPropiedadEndpoint();
        apiGroup.MapDesvincularPropiedadEndpoint();

        // Dashboard & Analytics
        apiGroup.MapObtenerKpisEndpoint();
        apiGroup.MapObtenerActividadEndpoint().CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization").SetVaryByQuery("inicio", "fin"));
        apiGroup.MapObtenerVentasMensualesEndpoint();
        apiGroup.MapObtenerSeguimientoEndpoint().CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
        apiGroup.MapObtenerProyeccionesEndpoint().CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));
        apiGroup.MapObtenerEficienciaEndpoint().CacheOutput(p => p.Tag("analytics-data").Expire(TimeSpan.FromMinutes(5)).SetVaryByHeader("Authorization"));

        // Configuracion
        apiGroup.MapObtenerPerfilEndpoint();
        apiGroup.MapActualizarPerfilEndpoint();
        apiGroup.MapInvitarAgenteEndpoint();
        apiGroup.MapAgenciasEndpoints();
        apiGroup.MapActivarPerfilEndpoint();
        apiGroup.MapListarAgentesEndpoint();

        // Calendario
        apiGroup.MapListarEventosEndpoint().CacheOutput();
        apiGroup.MapReprogramarEventoEndpoint();

        // IA Auditoría
        apiGroup.MapObtenerLogsIa();
        apiGroup.MapObtenerConversacionIa();

        // Webhooks (Sin Auth usualmente)
        endpoints.MapWhatsAppWebhooksEndpoints();
    }
}
