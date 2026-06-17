# 057 - Motor de Notificaciones Recurrentes PWA y Escalación de IA (Outbox Pattern Enterprise)

## 1. Objetivo
Rediseñar el motor de notificaciones en segundo plano para garantizar consistencia, rendimiento y trazabilidad, eliminando el riesgo de Dual-Write y previniendo la inanición (Starvation) y las fugas de memoria, usando un **Patrón Outbox Transaccional**.

## 2. Arquitectura de Backend (Outbox Pattern)
### 2.1. Extractor y Proyección Segura (Anti-Starvation)
Para evitar bloqueos al limitar la concurrencia (`Take(21)`), el sistema aplica un filtro inicial que asegura rotación viva, trayendo únicamente a los agentes que de verdad tienen tareas pendientes:
- `.Where(a => a.Tasks.Any(t => t.Estado == "Pendiente"))`
- Configuración de fechas operando estrictamente en UTC-5 (Ecuador) para toda la lógica de negocio (`DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5))`).
- Se anula la sobrecarga usando `.AsSplitQuery()` para proyectar las suscripciones sin un producto cartesiano perjudicial en PostgreSQL.

### 2.2. Escritura Única y Atómica
El motor descarta el Dual-Write en memoria/cola externa. Toda la inyección de Push se realiza directamente en la nueva entidad `PushNotificationsOutbox` del DbContext, finalizando el proceso con un único `await _dbContext.SaveChangesAsync()`. Si ocurre un fallo en este punto, el motor transaccional de PostgreSQL garantiza un rollback completo sin perder mensajes en el limbo.

### 2.3. Relay Worker Desacoplado
El despacho físico es consumido asincrónicamente por un Hosted Service o Job de Hangfire dedicado (`SendWebPushNotificationJob`), garantizando resiliencia:
- **Paginación estricta**: Límite de `Take(100)` para prevenir Out-Of-Memory (OOM) en picos de alta carga.
- **Control Concurrente**: Etiquetado con `[DisableConcurrentExecution]` para impedir envío duplicado de notificaciones por solapamiento de workers.

### 2.4. Resiliencia y Política de Reintentos (Dead Letter Queue)
- **Despacho Exitoso (201)**: El registro se elimina del Outbox para liberar la tabla.
- **Limpieza de Zombies (410/404)**: El sistema identifica suscripciones inválidas, las remueve del Outbox y ejecuta una limpieza en lote de la tabla de orígenes (`AgentPushSubscriptions.RemoveRange()`).
- **Retry Policy**: Límite estricto de 3 reintentos para fallos transitorios. Los mensajes se procesan ordenados por `RetryCount` para prevenir Head-Of-Line Blocking. Al fallar 3 veces, el mensaje es registrado de manera estructurada con `ILogger.LogError` (para auditoría DevOps) y eliminado de la cola.

## 3. Lógica de Negocio y Escalación
- **Tareas Futuras**: Configurable por el usuario (ej. alertar "X horas antes", ampliación del límite hasta 72 horas).
- **Tareas Vencidas**: Se avisa con base en el límite establecido en `NotifyOverdueTasksMaxHours` (hasta 72 horas configurables) para evitar el "Spam Perpetuo".
- **IA (AiHelp)**: Ignora los límites de fecha convencionales. Su escalación es inmediata, alertando de forma agresiva y deteniéndose automáticamente cuando se alcanza el tope de `NotifyAiHelpTasksMaxRetries`.

## 4. Frontend (React 19 FSD)
La interfaz de configuración (`ConfiguracionNotificaciones.tsx`) expone de forma amigable los nuevos controles (tiempos de antelación y de vencimiento ampliados). Además, el componente fue desacoplado y adaptado para aceptar un `agentId?: string` dinámico, permitiendo su renderizado sin colisiones desde los paneles del Súper Administrador Global.
