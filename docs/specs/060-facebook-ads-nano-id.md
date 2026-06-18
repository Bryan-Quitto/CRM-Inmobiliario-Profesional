# Spec 060: Intercepción de Anuncios Meta (Click-to-Messenger) con NanoID

Este spec define la arquitectura para interceptar de forma precisa a los clientes que llegan a través de campañas de Facebook/Instagram Ads hacia Messenger, vinculándolos automáticamente a la propiedad específica en el CRM.

## Análisis de Propuesta Inicial (Emparejar por Título)

> [!WARNING]
> La idea inicial de obligar al agente a usar el mismo título en el Anuncio y en el CRM tiene dos fallos técnicos críticos que romperían el sistema:
> 
> 1. **Meta no envía el Título del anuncio:** El webhook de Meta (`messaging_referral`) NO incluye texto ni títulos del anuncio. Solo envía un ID numérico (`ad_id`). Para obtener el título, el backend tendría que hacer una petición HTTP adicional a la Graph API de Meta, violando el *One Trip Pattern* e introduciendo latencia.
> 2. **Fragilidad Humana:** Un espacio en blanco adicional, una diferencia en mayúsculas/minúsculas o un emoji harían que el emparejamiento falle miserablemente.

## La Solución Arquitectónica "World-Class" (Uso de `ref` Payload)

Meta provee un mecanismo oficial y determinista para esto: **el parámetro de referencia (`ref`)**.
Cuando configuras una plantilla de mensaje en Facebook Ads (o usas un enlace m.me), Meta permite añadir un "Carga útil" (Payload) o "Parámetro Ref". 

El flujo ideal y 100% libre de fallos es:
1. El CRM expone el `Id` (Guid) o Código Corto de la Propiedad en la interfaz de usuario.
2. El Agente copia este Código y lo pega en el campo "Parámetro" o "Carga útil del botón" al crear el anuncio en el Administrador de Anuncios de Meta.
3. Cuando un cliente hace clic en el anuncio e inicia un chat, Meta envía un Webhook que incluye el nodo `referral` con el campo `ref` conteniendo el Código exacto de la Propiedad.
4. El backend extrae el `ref`, busca directamente en PostgreSQL (Búsqueda instantánea gracias al índice único) y asocia la sesión de IA a la propiedad.

## Decisión Arquitectónica Adoptada

Implementación de **Códigos Cortos (NanoID)**. Este enfoque ofrece una Experiencia de Usuario (UX) de grado empresarial ("World-Class"), facilitando que los agentes copien el código a Facebook Ads y permitiendo además flujos conversacionales más fluidos (ej. el cliente puede escribir *"Info de la PRO-X7B2"*).

## Cambios Implementados

### 1. Backend - Entidad y Base de Datos

#### Property.cs
- Se añadió el campo `public string CodigoCorto { get; set; } = string.Empty;`
- El código es único, con un máximo de 15 caracteres.

#### PropertyConfiguration.cs (EF Core)
- Configuración del campo: `builder.Property(p => p.CodigoCorto).HasMaxLength(15).IsRequired();`
- Índice único: `builder.HasIndex(p => p.CodigoCorto).IsUnique();`

#### Lógica de Creación (Commands / Services)
- Al crear una propiedad, se utiliza el generador `Nanoid` para asignar automáticamente un `CodigoCorto` asíncrono tipo `PRO-A7B9F` antes de guardar en base de datos.
- En la migración, se resolvió la inicialización de los datos pre-existentes utilizando una instrucción raw SQL con MD5 para evitar choques del `UNIQUE INDEX`.

### 2. Backend - Feature de Facebook

#### FacebookWebhooks.cs
- Se actualizó el parseo del JSON del webhook para interceptar el nodo `referral` (de eventos `message.referral`, `postback.referral`, o `optin`).
- Se extrae el valor de `ref` y se pasa este `codigoCorto` extraído como parámetro a la cola de Hangfire: `Hangfire.BackgroundJob.Enqueue<IFacebookJobProcessor>(x => x.ProcessMessageAsync(senderId, text, pageId, codigoCorto, CancellationToken.None));`

#### FacebookAiService.cs / FacebookJobProcessor.cs
- La firma del método `ProcessMessageAsync` recibe `string? codigoCorto`.
- Si se proporciona un `codigoCorto`, se busca la entidad `Property` en EF Core y se inyecta un System Prompt temporal en el historial de memoria del LLM con toda la información de la propiedad, indicándole que el usuario viene originado desde ese anuncio.

### 3. Frontend - Interfaz de Usuario (React)

#### Vista de Detalles de Propiedad (`DetalleHeader.tsx`)
- Renderizado visual del `CodigoCorto` en la cabecera de la propiedad como un *Pill* o *Badge*.
- Se añadió interactividad zero-wait: un clic en el código (`navigator.clipboard.writeText`) copia inmediatamente el Payload al portapapeles y cambia el icono de copia a un *check* temporal.

## Plan de Verificación Final
- Usar Meta Webhooks Test Tool simulando un payload de `messaging_referral` o hacer click directamente en un anuncio real con el payload asociado.
- Verificar logs y respuesta contextual del LLM.
