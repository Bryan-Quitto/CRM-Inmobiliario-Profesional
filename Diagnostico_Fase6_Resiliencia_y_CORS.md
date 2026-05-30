# Diagnóstico Fase 6: Resiliencia de Red y Políticas de Seguridad

Nuevamente he verificado tu trabajo. ¡La Fase 5 fue superada con éxito!
- La **Paginación** en `ListarPropiedades` y `ListarContactos` quedó perfectamente implementada. El servidor ya está protegido contra colapsos de memoria (OOM).
- El **Global Exception Handler** (`app.UseExceptionHandler()` + `AddProblemDetails()`) está en su lugar, garantizando que el Frontend siempre reciba respuestas estandarizadas RFC-7807 y no expongamos el StackTrace al público.

Habiendo asegurado la memoria y el enrutamiento de errores, llevé mi lupa hacia la **Resiliencia Externa y las Políticas de Red (Fase 6)**. He encontrado 2 vulnerabilidades críticas silenciosas:

## 1. Pérdida Silenciosa de Mensajes (Resiliency Bug en Hangfire)
**Ubicación:** `WhatsAppMessageSender.cs` (Línea 49-58)

**Problema:**
Cuando envías la petición HTTP a la API de Graph (Meta), logueas el error si la respuesta no es 2xx (`!response.IsSuccessStatusCode`) o si ocurre una excepción (`catch (Exception)`). Sin embargo, **no lanzas una excepción (no haces `throw`)**.

**Efecto Silencioso:**
Hangfire ejecuta tus envíos de mensajes en segundo plano. Si Meta se cae temporalmente (Error 500) o hay un problema de red, tu código simplemente lo loguea y termina su ejecución "con éxito". Hangfire, al ver que el método no lanzó excepciones, **marcará el trabajo como Completado y lo borrará**. El cliente nunca recibirá el mensaje de WhatsApp y no habrá reintentos automáticos. Para aprovechar la resiliencia de Hangfire, debes hacer `response.EnsureSuccessStatusCode();` o relanzar la excepción en el `catch`.

## 2. Política CORS Peligrosamente Permisiva (Security Risk)
**Ubicación:** `ServiceCollectionExtensions.cs` (Línea 109)

**Problema:**
La API tiene configurada la política por defecto como `AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()`.

**Efecto Silencioso:**
Para un CRM B2B corporativo, permitir cualquier origen (`*`) es una mala práctica de seguridad que expone tu backend a ser consumido desde cualquier dominio externo no autorizado. Aunque uses JWT, los navegadores permitirán que aplicaciones de terceros (potencialmente maliciosas) hagan peticiones cruzadas a tu API. Debes restringir el origen a la URL de tu aplicación en Vite (ej: `WithOrigins(builder.Configuration["FrontendUrl"])`).
