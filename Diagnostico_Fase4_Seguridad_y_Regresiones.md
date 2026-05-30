# Diagnóstico Fase 4: Seguridad, Validación y Regresiones

He revisado los últimos cambios de tu sesión anterior (las correcciones de zona horaria y la separación de lógica para aligerar los servicios).

Desafortunadamente, durante el proceso de refactorización se introdujo un error crítico que revirtió nuestro progreso inicial, y además he detectado una enorme falla de seguridad al revisar el marco de entrada de datos.

Aquí tienes las **2 fallas críticas (Fase 4)** detectadas:

## 1. Regresión Crítica de Facturación (Token Leakage V2)
**Ubicación:** `GeminiProvider.cs`

**Problema:**
Al extraer la lógica pesada hacia `GeminiSchemaMapper` para aligerar el archivo (cumpliendo con la regla de <200 líneas), el desarrollador **borró por accidente** el bloque de código que extraía el `UsageMetadata` del response de Google (Líneas 150-180 y el ciclo final `await foreach`).

**Efecto Silencioso:**
Hemos retrocedido al mismo error del inicio: la IA procesa respuestas correctamente, pero el CRM nunca registra el consumo porque las métricas regresan nulas. Estás regalando tokens de Gemini. Deberás restaurar el bloque `finalUsage.TotalTokenCount` y agregarlo al objeto `update`.

## 2. Vulnerabilidad de Seguridad Crítica (DDoS Financiero en Webhooks)
**Ubicación:** `Webhooks.cs` (Línea 36: `group.MapPost`)

**Problema:**
El endpoint que recibe los mensajes entrantes de Meta (WhatsApp) acepta cualquier payload JSON a ciegas e inmediatamente lo encola en Hangfire para que la IA lo procese. **No existe validación criptográfica de la firma `X-Hub-Signature-256`**.

**Efecto Silencioso:**
Este endpoint público es la puerta de entrada a la inteligencia artificial. Sin validación de la firma usando el App Secret de Meta, cualquier persona en internet puede simular ser Meta enviando miles de peticiones POST forjadas a `/api/webhooks/whatsapp`. Tu sistema procesará cada una, derivando en un ataque DDoS financiero catastrófico que agotará los fondos de tu cuenta de OpenAI o Gemini en cuestión de minutos. Debes implementar inmediatamente un Middleware o validación de firma HMAC SHA-256.
