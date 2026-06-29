# Manual de Comunicaciones y Canales (Omnicanalidad)

## 1. Integración de Canales (WhatsApp y Facebook)
El sistema proporciona omnicanalidad permitiendo recibir y responder mensajes tanto de WhatsApp como de Facebook Messenger utilizando una única interfaz conversacional potenciada por Inteligencia Artificial.

### Reglas de Negocio
- **Autenticación y Seguridad:** Ambos canales validan estrictamente los eventos recibidos (Webhooks) utilizando la firma `X-Hub-Signature-256` mediante algoritmos HMAC-SHA256, verificando que provienen legítimamente de Meta.
  "Tu seguridad es nuestra prioridad. El sistema verifica automáticamente que cada mensaje que recibes provenga realmente de WhatsApp o Facebook, evitando cualquier tipo de fraude o mensaje falso."
- **Resiliencia (Hangfire):** Para asegurar que ningún mensaje de cliente se pierda, los eventos de los canales se encolan mediante **Hangfire** para procesarse de manera asíncrona, robusta y tolerante a fallos.
  "Garantizamos que ningún mensaje de tus clientes se pierda. Si hay una interrupción temporal, el sistema guarda los mensajes de forma segura y los entrega en cuanto todo vuelve a la normalidad."

## 2. Procesamiento de Mensajes y Tipos Soportados
El sistema es capaz de entender texto y extraer contexto de otros tipos de contenido multimedia.
- **Mensajes de Texto y Audio:** Si un contacto envía un audio en WhatsApp, el sistema encola un trabajo de procesamiento específico (`ProcessAudioAsync`) para transcribirlo y comprenderlo.
  "La IA es capaz de procesar los mensajes de audio del cliente para poder ofrecer una respuesta confiable y acorde a lo que pida al cliente"
- **Otros Archivos Multimedia:** Imágenes, videos, documentos o stickers se registran en el historial de forma textual mediante marcadores (ej. `[Media: Imagen]`, `[Media: Documento]`) para mantener el contexto de la conversación.
  "Cuando un cliente envía fotos, videos o documentos, el sistema deja una nota clara en el historial de la conversación para que siempre sepas de qué están hablando."

## 3. Comportamiento de la Inteligencia Artificial (Copilot)
- **Activación por Agente:** El uso de IA en WhatsApp es configurable. Si la opción `IsWhatsAppAiEnabled` está desactivada para un agente, los mensajes simplemente se registrarán en su historial sin respuestas automáticas.
  "Tú decides cuándo usar el asistente inteligente. Puedes activarlo para que responda automáticamente o desactivarlo si prefieres atender personalmente todos los mensajes de WhatsApp."
- **Creación Automática de Contactos:** Si la configuración `AutoCreateWhatsAppContacts` (o si la IA está activa) está habilitada, el sistema creará automáticamente un nuevo Contacto/Lead cuando un número desconocido escriba por primera vez.
  "Olvídate de guardar números manualmente. Si un cliente nuevo te escribe, el sistema crea su perfil de contacto por ti de forma automática"
- **Entendimiento Semántico:** Se usa un enrutador semántico para detectar intenciones clave. Por ejemplo, si el cliente desea buscar otras propiedades (`NUEVA_BUSQUEDA`) o cambia radicalmente de interés (`CAMBIO_TEMA`), la IA reiniciará o ajustará el contexto de conversación sin perder el historial general.
  "Nuestro asistente es muy inteligente. Si el cliente cambia de opinión y pregunta por otra propiedad de repente, el asistente se adapta al instante y sigue la conversación con naturalidad."
- **Respuestas Automáticas y "Silence Mode":** Dependiendo de la etapa en la que se encuentre el Contacto, el sistema puede estar en una etapa restrictiva, enviando mensajes automáticos o entrando en modo silencio (Silence Mode) sin enviar respuestas, lo que le da control total al agente humano.
  "El asistente sabe cuándo dar un paso atrás. En las etapas clave del negocio, como una negociación, se silencia automáticamente para que tú tomes el control total de la charla."

## 4. Trazabilidad de Campañas (Facebook)
- El sistema extrae automáticamente códigos cortos de seguimiento (`codigoCorto` o `referral`) provenientes de enlaces compartidos, publicaciones o anuncios en Facebook, vinculando instantáneamente al cliente con una propiedad o campaña específica.
  "La IA es capaz de responder a clientes que esten escribiendo a través de un anuncio de Facebook"

## 5. Notificaciones Push Web
- Los agentes pueden suscribir sus dispositivos al sistema de notificaciones push basado en el estándar WebPush.
  "Recibe alertas directas en tu navegador web para que no te pierdas nada importante."
- Esto permite recibir alertas en tiempo real sobre nuevos mensajes, clientes o recordatorios, requiriendo autenticación segura vinculada a su cuenta.
  "Te avisaremos al instante sobre las tareas que tengas pendiente en tu agenda, o si la IA requiere de tu asistencia directamente en tu computadora o celular, manteniendo siempre tu información segura."