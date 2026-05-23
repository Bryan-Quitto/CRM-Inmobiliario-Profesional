# Spec 021: Soporte Nativo de Notas de Voz (OpenAI Whisper)

## 1. Contexto y Problema
En la industria inmobiliaria, un alto porcentaje de clientes (especialmente propietarios y clientes premium) prefieren enviar notas de voz largas por WhatsApp en lugar de escribir textos extensos. Actualmente, si el bot recibe un mensaje de tipo `audio`, la API lanza un error o simplemente lo ignora, generando una experiencia de usuario deficiente y un "bache" comunicacional.

## 2. Objetivo (World-Class UX)
Proveer soporte transparente para Notas de Voz. Cuando un usuario envíe un audio, el sistema debe descargarlo desde Meta, transcribirlo a texto usando la API **Whisper** de OpenAI, y procesarlo como si el usuario lo hubiera escrito. Todo esto debe ocurrir de forma resiliente y asíncrona dentro de Hangfire.

## 3. Arquitectura Propuesta: Meta Graph API + OpenAI AudioClient

### 3.1. Recepción en el Webhook
- En `Webhooks.cs`, se debe inspeccionar el campo `type` del mensaje.
- Si es `text`, se encola `ProcessMessageAsync(phone, body)`.
- Si es `audio`, se extrae el ID del audio (`audio.id`) y se encola un nuevo job: `BackgroundJob.Enqueue<IWhatsAppJobProcessor>(x => x.ProcessAudioAsync(phone, audioId))`.

### 3.2. Descarga Segura de Media (Meta Graph API)
- Meta no envía el archivo de audio directamente en el webhook, envía un ID.
- Para descargar el archivo, el `WhatsAppJobProcessor` (o un nuevo `WhatsAppMediaService`) debe:
  1. Hacer una petición `GET` a `https://graph.facebook.com/v18.0/{mediaId}` usando el `WHATSAPP_ACCESS_TOKEN`. Esto retorna un JSON con un campo `url`.
  2. Hacer una petición `GET` al `url` devuelto, inyectando nuevamente el `WHATSAPP_ACCESS_TOKEN` como Bearer auth. El resultado de esto es el `Stream` binario (usualmente formato `.ogg`).

### 3.3. Transcripción con OpenAI Whisper
- Se instanciará un `AudioClient` del SDK oficial de OpenAI: `new AudioClient("whisper-1", apiKey)`.
- Se pasará el `Stream` del audio a `AudioClient.TranscribeAudioAsync(stream, "audio.ogg")`.
- Whisper devolverá el texto exacto de lo que el usuario dijo.

### 3.4. Procesamiento Seamless
- Una vez obtenido el texto transcrito, el Job Processor simplemente llamará a `_aiService.ProcessIncomingMessageAsync(phone, transcripcion)`.
- (Opcional) Guardar en base de datos la transcripción indicando explícitamente que vino de un audio.

---

## 4. Requerimientos Técnicos (Checklist de Implementación)

### Fase 1: Extracción de Media (WhatsAppMediaService)
- [ ] Crear la interfaz y servicio `IWhatsAppMediaService` dentro de `Features/WhatsApp/Services/`.
- [ ] Implementar el método `Task<Stream> DownloadMediaAsync(string mediaId)` que ejecute los 2 pasos de la API de Meta descritos arriba. Registrarlo en `Program.cs` usando `HttpClient` con Polly.

### Fase 2: Actualización de Hangfire Job Processor
- [ ] Modificar `IWhatsAppJobProcessor` agregando el método `Task ProcessAudioAsync(string phone, string mediaId)`.
- [ ] En `WhatsAppJobProcessor`, inyectar `IWhatsAppMediaService`.
- [ ] Implementar la lógica de `ProcessAudioAsync`:
  1. Descargar el Stream del audio.
  2. Inicializar `AudioClient` de OpenAI.
  3. Ejecutar transcripción.
  4. Llamar a `WhatsAppAiService.ProcessIncomingMessageAsync(phone, transcripcion)`.

### Fase 3: Modificación del Webhook
- [ ] En `Webhooks.cs`, actualizar la lógica condicional:
  - Leer `message.TryGetProperty("type", out var typeProp)`.
  - Si `type == "text"`, encolar `ProcessMessageAsync`.
  - Si `type == "audio"`, extraer `message.GetProperty("audio").GetProperty("id").GetString()` y encolar `ProcessAudioAsync`.

---

## 5. Criterios de Aceptación
1. **Transparencia:** Si el usuario envía una nota de voz diciendo *"Me interesa una casa en el centro de hasta 100 mil dólares"*, el bot le debe responder recomendándole propiedades como si lo hubiera escrito por texto.
2. **Estabilidad:** Si la nota de voz falla al descargarse o al transcribirse, Hangfire retendrá el Job e intentará nuevamente.
3. **Velocidad:** El webhook debe responder en < 3s a Meta, independientemente del peso de la nota de voz o de lo que demore Whisper en procesarla.
