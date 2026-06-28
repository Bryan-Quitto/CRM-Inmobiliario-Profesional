# Manual de Comunicaciones y Canales (Omnicanalidad)

## 1. Integración de Canales (WhatsApp y Facebook)
El sistema proporciona omnicanalidad permitiendo recibir y responder mensajes tanto de WhatsApp como de Facebook Messenger utilizando una única interfaz conversacional potenciada por Inteligencia Artificial.

### Reglas de Negocio
- **Autenticación y Seguridad:** Ambos canales validan estrictamente los eventos recibidos (Webhooks) utilizando la firma `X-Hub-Signature-256` mediante algoritmos HMAC-SHA256, verificando que provienen legítimamente de Meta.
- **Idempotencia y Prevención de Duplicados:** Todo mensaje entrante (WhatsApp o Facebook) se guarda temporalmente en caché (por 1 hora) usando su identificador único (`wamid_{id}` o `fb_msg_{id}`) para evitar procesamientos duplicados si Meta reenvía eventos no confirmados.
- **Resiliencia (Hangfire):** Para asegurar que ningún mensaje de cliente se pierda, los eventos de los canales se encolan mediante **Hangfire** para procesarse de manera asíncrona, robusta y tolerante a fallos.

## 2. Procesamiento de Mensajes y Tipos Soportados
El sistema es capaz de entender texto y extraer contexto de otros tipos de contenido multimedia.
- **Mensajes de Texto y Audio:** Si un contacto envía un audio en WhatsApp, el sistema encola un trabajo de procesamiento específico (`ProcessAudioAsync`) para transcribirlo y comprenderlo.
- **Otros Archivos Multimedia:** Imágenes, videos, documentos o stickers se registran en el historial de forma textual mediante marcadores (ej. `[Media: Imagen]`, `[Media: Documento]`) para mantener el contexto de la conversación.

## 3. Comportamiento de la Inteligencia Artificial (Copilot)
- **Activación por Agente:** El uso de IA en WhatsApp es configurable. Si la opción `IsWhatsAppAiEnabled` está desactivada para un agente, los mensajes simplemente se registrarán en su historial sin respuestas automáticas.
- **Creación Automática de Contactos:** Si la configuración `AutoCreateWhatsAppContacts` (o si la IA está activa) está habilitada, el sistema creará automáticamente un nuevo Contacto/Lead cuando un número desconocido escriba por primera vez.
- **Entendimiento Semántico:** Se usa un enrutador semántico para detectar intenciones clave. Por ejemplo, si el cliente desea buscar otras propiedades (`NUEVA_BUSQUEDA`) o cambia radicalmente de interés (`CAMBIO_TEMA`), la IA reiniciará o ajustará el contexto de conversación sin perder el historial general.
- **Respuestas Automáticas y "Silence Mode":** Dependiendo de la etapa en la que se encuentre el Contacto, el sistema puede estar en una etapa restrictiva, enviando mensajes automáticos o entrando en modo silencio (Silence Mode) sin enviar respuestas, lo que le da control total al agente humano.

## 4. Trazabilidad de Campañas (Facebook)
- El sistema extrae automáticamente códigos cortos de seguimiento (`codigoCorto` o `referral`) provenientes de enlaces compartidos, publicaciones o anuncios en Facebook, vinculando instantáneamente al cliente con una propiedad o campaña específica.

## 5. Notificaciones Push Web
- Los agentes pueden suscribir sus dispositivos al sistema de notificaciones push basado en el estándar WebPush.
- Esto permite recibir alertas en tiempo real sobre nuevos mensajes, clientes o recordatorios, requiriendo autenticación segura vinculada a su cuenta.
