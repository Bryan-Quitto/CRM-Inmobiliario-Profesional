# Reporte de Auditoría de Logs — Backend (Admin, Agents, Configuración, Shared, WhatsApp, Facebook, PushNotifications)

**Generado:** 2026-07-05
**Archivos escaneados:** Múltiples (directorios de Features)
**Total logs encontrados:** 95
**Críticos 🔴:** 44 | **Advertencias 🟡:** 22 | **Revisar 🟢:** 29

---

## 🔴 CRÍTICOS — Eliminar Inmediatamente

### `CRM_Inmobiliario.Api/Features/Configuracion/InvitarAgente.cs`
**Líneas 26 y 49**
```csharp
Console.WriteLine($"[InvitarAgente]: Procesando invitación para {request.Email} (AgenciaId: {request.AgenciaId})");
Console.WriteLine($"[InvitarAgente]: Enviando invitación a {request.Email} con metadata...");
```
**Riesgo:** Exposición del correo electrónico (PII) directamente en consola.
**Acción:** ELIMINAR / REEMPLAZAR con log que enmascare el email o simplemente omitirlo.

### `CRM_Inmobiliario.Api/Features/Configuracion/ObtenerPerfil.cs`
**Línea 80**
```csharp
Console.WriteLine($"DEBUG [ObtenerPerfil]: Agente encontrado: {perfil.Nombre} {perfil.Apellido}");
```
**Riesgo:** Exposición de nombre y apellidos completos (PII).
**Acción:** ELIMINAR.

### `CRM_Inmobiliario.Api/Features/WhatsApp/ObtenerLogsIa.cs`
**Línea 166**
```csharp
logger.LogWarning("DEBUG Contacto No Identificado: Canal={Canal}, cid={Cid}, phone={Phone}, contactInDict={ContactInDict}, firstActivityId={FirstActivityId}", ...);
```
**Riesgo:** Expone el número de teléfono del usuario sin enmascarar.
**Acción:** ELIMINAR / ENMASCARAR el teléfono.

### `CRM_Inmobiliario.Api/Features/WhatsApp/WhatsAppAiService.cs`
**Línea 90**
```csharp
_logger.LogInformation("Procesando mensaje de {Phone}: {Message}", phone, messageText);
```
**Riesgo:** Expone teléfono y el contenido COMPLETO del mensaje del usuario (potencialmente altamente sensible).
**Acción:** ELIMINAR INMEDIATAMENTE.

**Líneas 74, 82, 103, 108, 160, 165**
```csharp
_logger.LogInformation("Bot inactivo para WhatsApp {Phone} porque el contacto está archivado. Mensaje ignorado y NO registrado en BD.", phone);
_logger.LogInformation("WhatsApp AI is globally disabled for agent {AgentId}. Silently ignoring message from {Phone}.", agente.Id, phone);
// ... y otros logs en estas líneas
```
**Riesgo:** Exponen el número de teléfono (`{Phone}`).
**Acción:** ENMASCARAR (ej. `...***1234`) o ELIMINAR.

### `CRM_Inmobiliario.Api/Features/WhatsApp/Services/WhatsAppJobProcessor.cs`
**Líneas 44, 80, 90**
```csharp
_logger.LogError(ex, "Error procesando webhook en background job para {Phone}", phone);
_logger.LogInformation("Audio subido a Supabase para {Phone}: {MediaUrl}", phone, mediaUrl);
_logger.LogError(ex, "Error procesando audio en background job para {Phone} y Media {MediaId}", phone, mediaId);
```
**Riesgo:** Exposición del número de teléfono y URLs a archivos multimedia (posible fuga de audios sensibles).
**Acción:** ELIMINAR / ENMASCARAR.

### `CRM_Inmobiliario.Api/Features/WhatsApp/Services/WhatsAppLlmOrchestrator.cs`
**Línea 156**
```csharp
_logger.LogInformation("--- TRANSCRIPCIÓN IA ---: {Transcription}", update.AudioTranscription);
```
**Riesgo:** Expone transcripción completa de audios, los cuales a menudo contienen PII, nombres, montos y otra información confidencial.
**Acción:** ELIMINAR INMEDIATAMENTE.

**Línea 289**
```csharp
_logger.LogInformation("--- RESPUESTA FINAL IA: {Response} ---", finalResponse);
```
**Riesgo:** Expone la respuesta completa generada por el LLM, pudiendo filtrar información privada de la BD o cotizaciones.
**Acción:** ELIMINAR.

**Líneas 73, 249**
```csharp
_logger.LogWarning("Límite de iteraciones excedido para {Phone}. Activando Circuit Breaker.", context.Phone);
// ...
```
**Riesgo:** Expone teléfono.
**Acción:** ENMASCARAR o ELIMINAR.

### `CRM_Inmobiliario.Api/Features/WhatsApp/Services/WhatsAppMessageSender.cs`
**Líneas 59, 105, 115, 149, 200**
```csharp
_logger.LogError("Error enviando mensaje de WhatsApp a {Phone}: {Error}", to, error);
// ...
```
**Riesgo:** Expone teléfono (en ocasiones con el payload del error de la API).
**Acción:** ENMASCARAR el teléfono.

### `CRM_Inmobiliario.Api/Features/WhatsApp/Services/Providers/GeminiProvider.cs`
**Líneas 185 a 187 y 315 a 317**
```csharp
Console.WriteLine("\n[GEMINI_DEBUG_PAYLOAD] --- START STREAM REQUEST ---");
try { Console.WriteLine(JsonSerializer.Serialize(contents, new JsonSerializerOptions { WriteIndented = true })); } catch { }
Console.WriteLine("[GEMINI_DEBUG_PAYLOAD] --- END STREAM REQUEST ---\n");
```
**Riesgo:** Riesgo MUY ALTO. Vuelca el payload JSON completo del request a Gemini hacia la consola, exponiendo todo el historial conversacional, datos de los clientes y system prompts en texto plano.
**Acción:** ELIMINAR INMEDIATAMENTE. Si es indispensable para desarrollo local, ocultarlo bajo una directiva `#if DEBUG` estricta.

### `CRM_Inmobiliario.Api/Features/Facebook/Services/FacebookAiService.cs`
**Línea 97 a 98**
```csharp
_logger.LogInformation("\n=== [Facebook AI] Mensaje de Usuario ===\nAgentId: {AgentId}\nPSID: {SenderId}\nMensaje: {Text}\n========================================", 
    ctx.Agente.Id, senderId, text);
```
**Riesgo:** Expone el mensaje COMPLETO y el PSID del usuario. El PSID (Page-Scoped ID) es considerado PII por las políticas de Meta.
**Acción:** ELIMINAR INMEDIATAMENTE.

**Línea 166 a 167**
```csharp
_logger.LogInformation("\n=== [Facebook AI] Respuesta de IA ===\nAgentId: {AgentId}\nTokens Totales: {TotalTokens} (Entrada: {InputTokens}, Salida: {OutputTokens})\nRespuesta: {Response}\n================================", 
    ctx.Agente.Id, streamTotalTokens, streamInputTokens, streamOutputTokens, response);
```
**Riesgo:** Expone respuesta generada.
**Acción:** ELIMINAR.

**Líneas 61, 68, 93, 142, 183**
```csharp
_logger.LogInformation("Bot inactivo para PSID {SenderId}. Mensaje ignorado.", senderId);
// ...
```
**Riesgo:** Exposición del PSID sin ofuscación.
**Acción:** ELIMINAR / ENMASCARAR.

### `CRM_Inmobiliario.Api/Features/Facebook/Services/FacebookContextBuilder.cs`
**Línea 54 a 57**
```csharp
_logger.LogInformation(
    "Nuevo contacto de Messenger: {Nombre} {Apellido} (PSID: {Psid}, fuente: {Source})",
    nombre, apellido, senderId,
    profile.FirstName != null ? "facebook_api" : "fallback");
```
**Riesgo:** Exposición crítica del Nombre, Apellido y PSID de un usuario de Facebook en una sola línea.
**Acción:** ELIMINAR INMEDIATAMENTE.

### `CRM_Inmobiliario.Api/Features/Facebook/Services/... (Otras clases)`
**Varias Líneas en FacebookAiLoopHelper.cs (41, 183), FacebookJobProcessor.cs (41), FacebookMessageSender.cs (29, 49, 92, 101, 127, 170) y FacebookProfileFetcher.cs (34, 51)**
```csharp
_logger.LogError("Error enviando mensaje de Facebook a PSID {Psid}: {Error}", recipientPsid, error);
```
**Riesgo:** Múltiples filtraciones del identificador PSID en excepciones y seguimiento.
**Acción:** ELIMINAR o ENMASCARAR.

---

## 🟡 ADVERTENCIAS — Debug Residual

Estos logs, aunque no contienen PII evidente, saturan la consola y exponen información interna/arquitectónica del flujo de ejecución. Deben ser limpiados en entornos productivos.

- **Admin/Jobs/BulkVectorizationJob.cs:** Líneas 30, 47, 54 (`_logger.LogInformation` con conteos de propiedades y estatus).
- **Configuracion/DesactivarAgente.cs:** Línea 77 (`Console.WriteLine("Error baneando...")`).
- **Configuracion/EliminarAgente.cs:** Línea 81 (`Console.WriteLine`).
- **Configuracion/InvitarAgente.cs:** Líneas 34, 67 (`Console.WriteLine` errores).
- **Configuracion/ObtenerPerfil.cs:** Línea 61 (`Console.WriteLine` debug info).
- **Configuracion/ReactivarAgente.cs:** Línea 44 (`Console.WriteLine`).
- **WhatsApp/ObtenerLogsIa.cs:** Línea 44.
- **WhatsApp/Services/WhatsAppLlmOrchestrator.cs:** Líneas 105, 122, 169, 210, 295 (Trazabilidad detallada del LLM, conteo de tokens).
- **WhatsApp/Services/WhatsAppMemoryProcessor.cs:** Línea 84.
- **WhatsApp/Services/Providers/GeminiProvider.cs:** Líneas 247, 272 (Reportes de tokens y tool calls).
- **Facebook/Services/FacebookAiLoopHelper.cs:** Líneas 64, 144.
- **Facebook/Services/FacebookAiService.cs:** Línea 49.
- **PushNotifications/Services/PushNotificationService.cs:** Línea 93.

---

## 🟢 REVISAR — Logs Potencialmente Legítimos

Estos logs exponen excepciones puras, auditoría de eventos de seguridad, identificadores internos puros (`contacto.Id`, `AgenteId`) sin adjuntar otra data, y mensajes de webhooks. Pueden conservarse si están destinados a sistemas de observabilidad, pero se recomienda verificar su nivel de verbosidad.

- **Agents/Services/AgentStateService.cs:** Líneas 28, 59 (Cambios de estado de agentes).
- **WhatsApp/ObtenerLogsIa.cs:** Línea 192.
- **WhatsApp/Webhooks.cs:** Líneas 52, 67, 89, 144 (Detecciones de firmas inválidas y mensajes duplicados — excelente para auditoría).
- **WhatsApp/Services/WhatsAppBotRulesProcessor.cs:** Líneas 50, 62 (Identificadores internos).
- **WhatsApp/Services/WhatsAppLlmOrchestrator.cs:** Líneas 205, 311 (Overflows mitigados y JSONs inválidos).
- **WhatsApp/Services/WhatsAppMemoryProcessor.cs:** Línea 89.
- **WhatsApp/Services/WhatsAppMessageSender.cs:** Líneas 36, 110, 126, 195, 241.
- **Facebook/FacebookWebhooks.cs:** Líneas 47, 62, 101, 158.
- **Facebook/Services/FacebookAiLoopHelper.cs:** Línea 139.
- **Facebook/Services/FacebookAiService.cs:** Línea 177.
- **Facebook/Services/FacebookMessageSender.cs:** Líneas 86, 164, 211.
- **PushNotifications/Services/PushNotificationService.cs:** Líneas 124, 128.

---

## Resumen Ejecutivo

El escaneo revela **riesgos severos de seguridad y cumplimiento legal** en las integraciones de WhatsApp y Facebook. Actualmente el sistema **vuelca a la consola transcripciones completas de audio, mensajes íntegros de los usuarios de redes sociales, respuestas del LLM y payloads completos JSON enviados a Gemini**. Adicionalmente, identificadores personales críticos como Números de Teléfono y PSIDs de Facebook están siendo impresos masivamente en los logs por cada acción, excediendo los límites seguros para GDPR o equivalentes de protección de datos. Es imperativo ejecutar un barrido de eliminación o enmascaramiento inmediato sobre los 44 hallazgos críticos reportados.
