# Diagnóstico Fase 8: Idempotencia y Condiciones de Carrera en IA

He auditado tus últimas correcciones y son formidables:
- El `DbUpdateConcurrencyException` en `ActualizarPropiedad.cs` ya es real gracias al campo `Version` exigido al cliente. Nunca más habrá aplastamiento de datos silenciosos (Last-Write-Wins).
- El worker `PdfWorker.cs` ahora falla ruidosamente si no puede descargar la imagen, deteniendo la cadena y salvando al PDF de la corrupción.

Entrando a la **Fase 8**, decidí inspeccionar a fondo la integración estrella del CRM: El Motor de Inteligencia Artificial de WhatsApp. Lamentablemente, he detectado 2 vulnerabilidades críticas que comprometen directamente el costo financiero de la API de IA y la cordura del bot:

## 1. Carencia Absoluta de Idempotencia en Webhooks (Double Billing)
**Ubicación:** `Webhooks.cs`

**Problema:**
Cuando WhatsApp (Meta) envía el Webhook, la estructura JSON trae una propiedad fundamental llamada `message.id` (el `wamid...`). **Tu código no extrae ni utiliza este ID**.

**Efecto Silencioso:**
Meta garantiza "At-Least-Once Delivery". Si Meta cree que el servidor tardó mucho en responder, **te reenviará el mismo Webhook**. Como Hangfire no tiene forma de saber que es el mismo mensaje (ya que le pasas solo el número y el texto), procesará el mensaje 2 veces. El modelo de Gemini/OpenAI generará 2 respuestas, gastarás el doble de Tokens (Double Billing), y el cliente recibirá 2 mensajes repetidos por WhatsApp. Debes extraer el `id` y crear un chequeo de idempotencia (por ejemplo, validar si el ID ya existe en una tabla de mensajes procesados).

## 2. Corrupción de Contexto IA por Condición de Carrera (Lost Updates)
**Ubicación:** `WhatsAppConversationManager.cs` y Hangfire Jobs

**Problema:**
Hangfire procesa trabajos en paralelo. Si un usuario envía dos mensajes rápidos por WhatsApp (Ej: "Hola" y "Busco casa"), Hangfire levanta 2 hilos simultáneos.
Ambos hilos hacen `_context.WhatsappConversations.FirstOrDefaultAsync(...)` al mismo tiempo. Ambos ven el historial vacío. Ambos llaman a la IA al mismo tiempo. Al finalizar, el hilo 1 guarda `["Hola", "Respuesta 1"]` y el hilo 2 guarda `["Busco casa", "Respuesta 2"]`.

**Efecto Silencioso:**
El hilo 2 sobrescribe totalmente el guardado del hilo 1 en `SaveStateAsync()`. El historial "Hola" se pierde para siempre (Lost Update). La IA sufrirá amnesia severa con clientes que mandan varios mensajes cortos seguidos. Debes utilizar candados distribuidos (`Hangfire.DisableConcurrentExecution`) basados en el número de teléfono, o usar Pessimistic Locking a nivel de fila en la BD para serializar las respuestas.
