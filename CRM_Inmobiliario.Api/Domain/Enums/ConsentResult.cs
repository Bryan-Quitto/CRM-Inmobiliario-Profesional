namespace CRM_Inmobiliario.Api.Domain.Enums;

public enum ConsentResult
{
    PendingConsent,
    
    /// <summary>
    /// Se acaba de enviar la solicitud (o el re-envío). El flujo debe detenerse aquí.
    /// </summary>
    RequestSent,
    
    /// <summary>
    /// El usuario respondió SÍ y el consentimiento fue otorgado. Continúa con el flujo normal.
    /// </summary>
    Granted,
    
    /// <summary>
    /// El usuario acaba de otorgar el consentimiento. Se le envió el agradecimiento y el flujo debe detenerse para no enviar "SÍ" al LLM.
    /// </summary>
    JustGranted,
    
    /// <summary>
    /// El usuario respondió NO en este momento. Se le envió la despedida. El flujo se detiene.
    /// </summary>
    DeniedResponse,
    
    /// <summary>
    /// El usuario está en PendingConsent pero no respondió Sí/No. Se re-envió la solicitud o se guarda silencio.
    /// </summary>
    StillPending,
    
    /// <summary>
    /// El usuario ya había denegado el consentimiento previamente. Silencio total.
    /// </summary>
    Denied
}
