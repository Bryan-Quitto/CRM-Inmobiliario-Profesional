# Spec 058: Auditoría y Origen de Mensajes Salientes (Agente vs IA)

## 1. Contexto y Objetivo
El CRM ya guardaba un historial de los mensajes entrantes vía webhook (WhatsApp y Facebook). Sin embargo, existía un vacío de auditoría con los mensajes **salientes**: si un Agente Humano enviaba un mensaje, no quedaba registrado en la base de datos, lo que generaba un historial de conversación incompleto.

El objetivo de esta especificación es detallar la solución implementada para garantizar que **todo mensaje saliente** quede registrado en el historial (independientemente del canal), y que en la interfaz del CRM (Frontend) sea inmediatamente evidente si dicho mensaje fue emitido por la Inteligencia Artificial o por un Agente Humano.

## 2. Cambios en Base de Datos
Se crearon nuevas migraciones con Entity Framework Core (`AddOrigenToMessages`) para actualizar el esquema de datos:

- **Entidad `WhatsappMessage`:** 
  - Añadido `AgenteId` (`Guid?`)
  - Añadido `OrigenMensaje` (`string`)
- **Entidad `FacebookMessage`:** 
  - Añadido `OrigenMensaje` (`string`)

Los valores permitidos y controlados para `OrigenMensaje` son:
- `"Cliente"`: Mensaje entrante.
- `"IA"`: Mensaje saliente autogenerado por el LLM.
- `"AgenteHumano"`: Mensaje saliente emitido por una acción humana desde la UI.

## 3. Centralización de Logs en el Backend (C#)
Para garantizar una auditoría a prueba de errores, se centralizó el guardado en base de datos en las clases de envío finales: `WhatsAppMessageSender` y `FacebookMessageSender`.

### Implementación en `MessageSender`
1. Al invocar la API respectiva (Meta Graph), si el envío resulta exitoso (`200 OK`), se lanza la lógica de guardado.
2. Dado que los *Senders* son inyectados habitualmente como clases transitorias, se inyectó `IServiceScopeFactory`.
3. Con el *Factory*, se abre un scope temporal transaccional para instanciar `CrmDbContext`, armar el objeto de la entidad (ej. `WhatsappMessage`) y guardarlo asíncronamente en la base de datos sin comprometer ciclos de vida en operaciones *fire-and-forget* (como streaming IA).

### Modificación de Servicios de IA
Las clases encargadas de orquestar la Inteligencia Artificial (`WhatsAppAiService` y `FacebookAiService`) fueron refactorizadas para:
- **Eliminar** la llamada manual al registro de mensajes de IA a la base de datos (ya que ahora el *Sender* asume esa responsabilidad).
- Enviar el flag `isAiResponse: true` al *Sender* durante la llamada de envío de mensaje.

### Actualización de los Endpoints (APIs)
Los endpoints de consulta (`ObtenerConversacionIa.cs` y `ObtenerConversacionFacebookIa.cs`) fueron actualizados para incluir `OrigenMensaje` dentro de la carga JSON retornada a la web, conservando la propiedad original `Rol` para propósitos de maquetado.

## 4. Cambios en Frontend (React / TypeScript)
La UI del chat se actualizó para reflejar el origen del mensaje con insignias visuales (badges).

- **Actualización de Tipos (`auditoria.ts`):** Se modificó la interfaz `MensajeChat` inyectando `origenMensaje?: string`.
- **Renderizado de Burbujas:** En `AuditoriaSectionConversacion.tsx` (estilo WhatsApp) y `AuditoriaSectionFacebookConversacion.tsx` (estilo Messenger), la interfaz detecta si el mensaje va alineado a la derecha (saliente). De ser así, se lee `origenMensaje`.
- **Display de Origen:**
  - Si es `"IA"`, se imprime un badge sutil: `🤖 IA`.
  - Si es `"AgenteHumano"`, se imprime un badge: `👤 Agente`.
  - Todo se visualiza sin romper la disposición de tiempo y estilos de burbuja del componente contenedor.

## 5. Resumen de Impacto
1. **Auditoría Completa:** Nunca más un mensaje saldrá del servidor sin ser registrado en la bitácora local.
2. **Claridad para la Operación:** Los agentes / administradores revisan los historiales y saben exactamente de dónde provino un texto particular.
3. **Escalabilidad:** Cualquier módulo futuro (ej. módulo de Live Chat) que importe el *Sender* para disparar un mensaje, de facto registrará el evento de la conversación sin añadir código redundante.
