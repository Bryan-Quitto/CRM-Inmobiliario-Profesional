# Informe de Auditoría Técnico-Legal: Lúmina CRM

Este informe contrasta las afirmaciones legales presentes en los documentos `politica_privacidad.md` y `terminos_servicio.md` con la realidad técnica implementada en el código fuente de la plataforma.

## 1. Inconsistencias y Afirmaciones Falsas

### 1.1. Integración Inexistente con Instagram
*   **Reclamación (Falsa):** Ambos documentos mencionan soporte para "Instagram" como parte de las "integraciones oficiales de Meta (WhatsApp, Facebook, Instagram)" para la recepción y envío de mensajes automatizados o manuales.
*   **Realidad Técnica:** El sistema actualmente soporta WhatsApp (`WhatsappConversation`, `MapWhatsAppWebhooksEndpoints`) y Facebook Messenger (`FacebookConversation`, `MapFacebookWebhooksEndpoints`). Sin embargo, el soporte para mensajes directos de Instagram **no está implementado**. De hecho, en el archivo `FacebookWebhooks.cs` (Línea 69) existe un comentario explícito en el código que bloquea los eventos de Instagram: `// Verificar que el evento pertenece a una página de Facebook (no a Instagram, etc.)`.
*   **Riesgo Legal:** Ofrecer características en un contrato B2B que no existen puede considerarse publicidad engañosa y un incumplimiento de los Términos de Servicio.
*   **Recomendación:** Eliminar las referencias a "Instagram" en ambos documentos hasta que la característica se implemente de manera formal en el backend.

## 2. Ambigüedades y Falencias

### 2.1. Portabilidad de Datos de la Agencia
*   **Reclamación (Ambigua):** Los Términos de Servicio (Sección 5) establecen: *"En caso de terminación del servicio, el Usuario tiene derecho a exportar (portabilidad) sus datos según los formatos disponibles en la plataforma."*
*   **Realidad Técnica:** Una revisión exhaustiva del código (búsqueda de herramientas de exportación general) demuestra que, si bien existe una funcionalidad para exportar fichas individuales de propiedades a PDF (`005-fichas-pdf.md`), **no existen endpoints ni funciones para que la Agencia exporte masivamente su base de datos** (ej. exportar todos los contactos a CSV, Excel o JSON).
*   **Riesgo Legal:** Aunque la frase "según los formatos disponibles" mitiga un poco el riesgo, la Ley Orgánica de Protección de Datos Personales (LOPDP) exige garantizar un derecho a la portabilidad real. Actualmente, las agencias quedan cautivas al no poder migrar el volumen de sus prospectos y contactos de manera efectiva.
*   **Recomendación:** Modificar la redacción para ser transparentes respecto a que la exportación masiva requiere contactar a soporte, o priorizar en la hoja de ruta técnica la creación de un botón de exportación a `.csv` de la tabla de Contactos y Propiedades.

## 3. Afirmaciones Verificadas como Verdaderas (Cumplimiento Correcto)

La auditoría técnica logró validar la veracidad de las siguientes declaraciones presentes en los documentos:

*   **WhatsApp y Facebook:** La recopilación del *WhatsApp Number* y *Facebook Sender ID (PSID)* está implementada en las entidades `Contacto`, `WhatsappConversation` y `FacebookConversation`.
*   **Integración con Inteligencia Artificial:** 
    *   **OpenAI y Google Gemini:** Están integrados de forma dual (Dual-Provider) mediante el SDK oficial y REST, respetando si la agencia configura su propia clave (BYOK) (`AgentAiResponseGenerator`, `ConsultarBaseConocimientoHandler`).
    *   **Whisper:** Se evidencia el uso de `OpenAI Whisper` (`whisper-1`) para la transcripción de notas de voz, justificando la mención de esto en la política de privacidad.
*   **Suscripciones a Notificaciones WebPush:** El sistema registra y hace uso de `WebPushClient` (de la librería `.NET WebPush`) a través del worker asíncrono `SendWebPushNotificationJob`.
*   **Caché y Almacenamiento Local (Zustand / SWR):** La declaración de que Lúmina usa caché de aplicación en la memoria del navegador para optimizar el rendimiento es 100% precisa. Se hace uso intensivo de `swr` con `localStorageProvider` y `zustand` con el middleware `persist`.
*   **Supabase (Auth y PostgreSQL):** La autenticación está fuertemente acoplada a Supabase (usando `RLS` y `JWT`) y la infraestructura general de almacenamiento de archivos (`Supabase Storage`) y base de datos vectorial (`Pgvector.Vector`).
