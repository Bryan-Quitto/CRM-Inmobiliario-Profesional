using CRM_Inmobiliario.Api.Features.Analitica;
using CRM_Inmobiliario.Api.Features.Calendario;
using CRM_Inmobiliario.Api.Features.Contactos;
using CRM_Inmobiliario.Api.Features.Contactos.FusionarContactos;
using CRM_Inmobiliario.Api.Features.Configuracion;
using CRM_Inmobiliario.Api.Features.Configuracion.Seguridad;
using CRM_Inmobiliario.Api.Features.Dashboard;
using CRM_Inmobiliario.Api.Features.Interacciones;
using CRM_Inmobiliario.Api.Features.Intereses;
using CRM_Inmobiliario.Api.Features.Propiedades;
using CRM_Inmobiliario.Api.Features.SeccionesGaleria;
using CRM_Inmobiliario.Api.Features.Tareas;
using CRM_Inmobiliario.Api.Features.WhatsApp;
using CRM_Inmobiliario.Api.Features.IA;
using CRM_Inmobiliario.Api.Features.Facebook;
using CRM_Inmobiliario.Api.Features.Admin;
using CRM_Inmobiliario.Api.Features.CorporateKnowledge.IngestDocument;
using CRM_Inmobiliario.Api.Features.AgentAi.Endpoints;
using CRM_Inmobiliario.Api.Features.FinOps.GetAgentTokenUsage;
using CRM_Inmobiliario.Api.Features.PushNotifications;
using CRM_Inmobiliario.Api.Features.Faqs;
using CRM_Inmobiliario.Api.Features.Shared.OmniSearch;
using CRM_Inmobiliario.Api.Features.Portabilidad.ExportarDatos;

namespace CRM_Inmobiliario.Api.Extensions;

public static class EndpointRouteBuilderExtensions
{
    public static void MapProjectEndpoints(this IEndpointRouteBuilder endpoints)
    {
        var apiGroup = endpoints.MapGroup("/api").RequireAuthorization();

        // Contactos
        apiGroup.MapGetDropdownContactosEndpoint();
        apiGroup.MapRegistrarContactoEndpoint();
        apiGroup.MapBuscarContactosEndpoint();
        apiGroup.MapListarContactosEndpoint().CacheOutput();
        apiGroup.MapObtenerContactoPorIdEndpoint();
        apiGroup.MapActualizarContactoEndpoint();
        apiGroup.MapEliminarContactoEndpoint();
        apiGroup.MapCambiarEstadoContactoEndpoint();
        apiGroup.MapRevertirEstadoContactoEndpoint();
        apiGroup.MapCompartirContactoEndpoint();
        apiGroup.MapRevocarCompartidoEndpoint();
        apiGroup.MapObtenerAgentesCompartidosEndpoint();
        apiGroup.MapToggleBotActivoEndpoint();
        apiGroup.MapBotOverrideContactoEndpoint();
        apiGroup.MapObtenerTokenUsageContactoEndpoint();
        apiGroup.MapFusionarContactosEndpoint();
        apiGroup.MapToggleContactArchiveEndpoint();

        // Propiedades
        apiGroup.MapGetDropdownPropiedadesEndpoint();
        apiGroup.MapRegistrarPropiedadEndpoint();
        apiGroup.MapBuscarPropiedadesEndpoint();
        apiGroup.MapListarPropiedadesEndpoint().CacheOutput(p => p.Tag("properties-data"));
        apiGroup.MapObtenerPropiedadPorIdEndpoint();
        apiGroup.MapActualizarPropiedadEndpoint();
        apiGroup.MapCambiarEstadoPropiedadEndpoint();
        apiGroup.MapEliminarImagenPropiedadEndpoint();
        apiGroup.MapSubirImagenPropiedadEndpoint();
        apiGroup.MapEliminarTodasLasImagenesEndpoint();
        apiGroup.MapGenerarCodigoCortoPropiedadEndpoint();
        apiGroup.MapEstablecerImagenPrincipalEndpoint();
        apiGroup.MapLimpiarImagenesPropiedadEndpoint();
        apiGroup.MapEliminarImagenesSeleccionadasEndpoint();
        apiGroup.MapImportarRemaxEndpoint();
        apiGroup.MapVolverAListarPropiedadEndpoint();
        apiGroup.MapObtenerHistorialPropiedadEndpoint();
        apiGroup.MapEliminarTransaccionEndpoint();
        apiGroup.MapTogglePropertyArchiveEndpoint();

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
        apiGroup.MapAceptarTerminosServicioEndpoint();
        apiGroup.MapExportarDatosEndpoint();
        apiGroup.MapActualizarPerfilEndpoint();
        apiGroup.MapSubirFotoPerfilEndpoint();
        apiGroup.MapSubirLogoAgenciaEndpoint();
        apiGroup.MapUpdateNotificationSettingsEndpoint();
        apiGroup.MapInvitarAgenteEndpoint();
        apiGroup.MapAgenciasEndpoints();
        apiGroup.MapUpdateAgentArchivingConfigEndpoint();
        apiGroup.MapObtenerCandidatosArchivadoEndpoint();
        apiGroup.MapActivarPerfilEndpoint();
        apiGroup.MapListarAgentesEndpoint();
        apiGroup.MapDesactivarAgenteEndpoint();
        apiGroup.MapEliminarAgenteEndpoint();
        apiGroup.MapReactivarAgenteEndpoint();
        apiGroup.MapActivarAgenteInvitadoEndpoint();
        apiGroup.MapListarLogsSeguridadEndpoint();
        apiGroup.MapAdminApiKeysEndpoints();
        apiGroup.MapConfiguracionIAEndpoints();
        apiGroup.MapFacebookOAuthEndpoints();
        apiGroup.MapGetAgentTokenUsageEndpoint();

        // OmniSearch
        apiGroup.MapBuscarOmniSearch();

        // Calendario
        apiGroup.MapListarEventosEndpoint().CacheOutput();
        apiGroup.MapReprogramarEventoEndpoint();

        // IA Auditoría
        apiGroup.MapObtenerLogsIa();
        apiGroup.MapObtenerConversacionIa();
        apiGroup.MapObtenerConversacionFacebookIa();
        apiGroup.MapObtenerAuditoriaGeneral();

        // Webhooks (Sin Auth)
        endpoints.MapWhatsAppWebhooksEndpoints();
        endpoints.MapFacebookWebhooksEndpoints();

        // Admin
        apiGroup.MapReVectorizeEndpoint();
        apiGroup.MapIngestDocumentEndpoint();

        // Agent AI
        apiGroup.MapStreamChatEndpoint();
        apiGroup.MapGetConversationsEndpoint();
        apiGroup.MapGetConversationMessagesEndpoint();
        apiGroup.MapUpdateConversationTitleEndpoint();
        apiGroup.MapDeleteConversationEndpoint();

        // Push Notifications
        apiGroup.MapPushNotificationsEndpoints();

        // FAQs
        apiGroup.MapCrearFaqEndpoint();
        apiGroup.MapListarFaqsEndpoint().CacheOutput(p => p.Expire(TimeSpan.FromSeconds(30)).SetVaryByHeader("Authorization").SetVaryByRouteValue("propiedadId"));
        apiGroup.MapEditarFaqEndpoint();
        apiGroup.MapEnviarARevisionEndpoint();
        apiGroup.MapAprobarFaqEndpoint();
        apiGroup.MapRechazarFaqEndpoint();
        apiGroup.MapDesactivarFaqEndpoint();
        apiGroup.MapReactivarFaqEndpoint();
        apiGroup.MapEliminarBorradorEndpoint();
    }
}
