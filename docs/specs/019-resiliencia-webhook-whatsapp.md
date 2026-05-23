# Spec 019: Resiliencia y Encolamiento del Webhook de WhatsApp

## 1. Contexto y Problema
Actualmente, `Webhooks.cs` procesa los mensajes entrantes de Meta (WhatsApp) mediante un `Task.Run()` en segundo plano. Aunque esto evita el timeout de Meta (se debe responder en < 3 segundos), tiene dos problemas críticos:
1. **Pérdida de Datos en Reinicios:** Si el App Pool (Kestrel/IIS) se recicla, la aplicación crashea, o se despliega una nueva versión, los `Task.Run` en vuelo se destruyen instantáneamente. Los mensajes de los clientes se pierden.
2. **Falta de Reintentos (Resiliencia):** Si la API de OpenAI está temporalmente caída, o Meta Graph API rechaza el envío, el código lanza una excepción (`catch`) y muere. El cliente nunca recibe respuesta y el sistema no reintenta.

## 2. Objetivo (World-Class Reliability)
- Garantizar que **0 mensajes se pierdan**. Todo webhook recibido debe persistirse en una cola antes de procesarse.
- Implementar **Reintentos Exponenciales** (Polly) para las llamadas a OpenAI y Meta.

## 3. Arquitectura Propuesta: Hangfire + PostgreSQL + Polly
Dado que el proyecto ya utiliza PostgreSQL (Supabase) y EF Core, la solución de menor fricción y mayor robustez es **Hangfire** respaldado por PostgreSQL. No requiere levantar contenedores adicionales (como RabbitMQ) y provee un Dashboard nativo para ver los mensajes encolados.

### 3.1. Encolamiento con Hangfire
- El Webhook (`Webhooks.cs`) recibirá el JSON.
- Extraerá el `phone` y el `body`.
- Encolará un "Background Job": `BackgroundJob.Enqueue<IWhatsAppJobProcessor>(x => x.ProcessMessageAsync(phone, body))`.
- Devolverá `200 OK` a Meta inmediatamente (Zero-Wait real).

### 3.2. Procesamiento (WhatsAppJobProcessor)
- `WhatsAppJobProcessor` será una nueva clase (inyectada por DI) que envolverá la llamada a `WhatsAppAiService.ProcessIncomingMessageAsync`.
- Hangfire automáticamente reintentará el trabajo si falla, aplicando *Exponential Backoff* por defecto.

### 3.3. Resiliencia HTTP (Polly)
- Se añadirá `Microsoft.Extensions.Http.Resilience` (.NET 8+ Standard).
- En `Program.cs`, el registro de `AddHttpClient()` se configurará con `.AddStandardResilienceHandler()` (que internamente usa Polly para reintentos, timeouts y circuit breakers).

---

## 4. Requerimientos Técnicos (Checklist de Implementación)

### Fase 1: Configuración de Hangfire
- [ ] Instalar paquetes NuGet: `Hangfire.Core`, `Hangfire.PostgreSql`, `Hangfire.AspNetCore`.
- [ ] En `Program.cs`, configurar `builder.Services.AddHangfire(config => config.UsePostgreSqlStorage(dbString))`.
- [ ] En `Program.cs`, habilitar el servidor: `builder.Services.AddHangfireServer()`.
- [ ] (Opcional) Configurar el Dashboard: `app.UseHangfireDashboard("/hangfire")`.

### Fase 2: Refactor del Webhook
- [ ] Crear la interfaz y clase `WhatsAppJobProcessor : IWhatsAppJobProcessor` en `Features/WhatsApp/Services/`.
- [ ] Mover la lógica de inyección de alcance que estaba en `Webhooks.cs` al procesador o hacer que el procesador inyecte `WhatsAppAiService`.
- [ ] Modificar `Webhooks.cs` para reemplazar el `Task.Run(...)` por `BackgroundJob.Enqueue<IWhatsAppJobProcessor>(...)`.

### Fase 3: Resiliencia con Polly
- [ ] Instalar paquete `Microsoft.Extensions.Http.Resilience`.
- [ ] En `Program.cs`, actualizar `builder.Services.AddHttpClient()` agregando `.AddStandardResilienceHandler()` para blindar las llamadas salientes.
- [ ] Revisar si el cliente de OpenAI (`ChatClient`) requiere una configuración manual de retries en su constructor.

---

## 5. Criterios de Aceptación
1. **Persistencia:** Al apagar el servidor web bruscamente mientras un mensaje se está procesando, al encenderlo nuevamente, Hangfire debe retomar el procesamiento desde la base de datos y enviar el mensaje.
2. **Dashboard:** Poder entrar a `/hangfire` (autenticado si es posible, o anónimo en desarrollo) y ver los jobs encolados, procesados o fallidos.
3. **Reintentos:** Si se simula una desconexión de red o un timeout, el job de Hangfire debe fallar, registrar el error y reprogramarse automáticamente para intentarlo en unos minutos.
