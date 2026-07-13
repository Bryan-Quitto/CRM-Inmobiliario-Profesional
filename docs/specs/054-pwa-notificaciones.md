# Spec 054: PWA y Notificaciones Push Nativas (VAPID)

## 1. Visión General
Implementación de PWA (Progressive Web App) y notificaciones push en tiempo real para el CRM Inmobiliario Profesional. 
Por decisión arquitectónica, se opta por **Web Push Nativo (VAPID)** en lugar de intermediarios (Firebase u OneSignal) para garantizar control absoluto, privacidad total de los datos y cero costos de escalabilidad.

## 2. Estrategia PWA
Para que el navegador reconozca la aplicación como instalable (ofreciendo el prompt "Añadir a la pantalla de inicio") y permita notificaciones en iOS (requerido en iOS 16.4+), se implementará:

- **`manifest.json`**:
  - `name` y `short_name`.
  - `start_url`: `/` (o la ruta del dashboard del agente).
  - `display`: `standalone` (vital para la experiencia nativa).
  - `background_color` y `theme_color`.
  - `icons`: Array de iconos (192x192, 512x512) enmascarables.
- **Service Worker (`sw.js`)**:
  - Registro en el ciclo de vida de React.
  - Estrategia de caché básica para assets estáticos (opcional en esta fase, pero el archivo debe existir y registrar el evento `fetch` mínimamente).
  - Manejador del evento `push` para recibir la notificación en segundo plano.
  - Manejador del evento `notificationclick` para enfocar o abrir la ventana del chat al tocar la alerta.

## 3. Gestión de Suscripciones (Base de Datos)
Dado que un agente puede operar simultáneamente desde una laptop y un móvil, la relación Agente -> Dispositivo es de **1 a N**. Añadir un campo único en la tabla `Usuarios` es un antipatrón arquitectónico.

### Nueva Entidad: `AgentPushSubscriptions`
Se creará una nueva tabla en la base de datos a través de EF Core:
- `Id` (Guid, PK)
- `AgentId` (FK -> Usuarios)
- `Endpoint` (String, Url del Push Service del navegador, única)
- `P256dh` (String, llave pública de encriptación del navegador)
- `Auth` (String, secreto de autenticación del navegador)
- `UserAgent` (String, opcional para identificar si es móvil/desktop)
- `CreatedAt` (DateTimeOffset)
- `LastUsedAt` (DateTimeOffset)

## 4. Arquitectura Frontend (React)

### Flujo de Suscripción
1. **Solicitud de Permisos:** Tras un inicio de sesión exitoso (o mediante un banner proactivo "Activar Notificaciones"), se invoca `Notification.requestPermission()`.
2. **Suscripción VAPID:** Si el permiso es `granted`, se llama a `serviceWorkerRegistration.pushManager.subscribe()` pasando la **VAPID Public Key** (proveída por variables de entorno).
3. **Registro en el Backend:** El objeto `PushSubscription` resultante (que contiene `endpoint`, `keys.p256dh`, y `keys.auth`) se envía al backend.
4. **Endpoint Frontend:**
   - `POST /api/agente/dispositivos/suscribir`
   - Payload: `{ endpoint, p256dh, auth, userAgent }`

### Manejo en Segundo Plano (`sw.js`)
El Service Worker escuchará el evento `push`. Al recibir un payload (ej. `{ "title": "Asistencia Requerida", "body": "El cliente Juan solicita ayuda", "url": "/chat/123" }`), ejecutará `self.registration.showNotification(title, options)`.

## 5. Arquitectura Backend (.NET 10)

### Configuración VAPID
Se utilizará la librería estándar de la industria para .NET (`WebPush`).
- **Claves VAPID:** Se generará un par de claves VAPID (Pública y Privada). Se almacenarán en los secretos del entorno (o `.env`).
- `VapidSubject`: `mailto:soporte@zielluxoracrm.com`

### Modificación de la Herramienta `SolicitarAsistenciaHumana`
Cuando la IA (o el sistema) dispare la necesidad de asistencia humana:
1. **Recuperación de Dispositivos:** El backend consultará la tabla `AgentPushSubscriptions` filtrando por el `AgentId` asignado.
2. **Construcción del Payload:** 
   ```json
   {
     "title": "🚨 Asistencia Humana Solicitada",
     "body": "El lead [Nombre] requiere intervención inmediata.",
     "data": { "url": "/conversaciones/[Id]" }
   }
   ```
3. **Envío del Push:** El backend iterará sobre las suscripciones activas del agente y utilizará `WebPushClient.SendNotificationAsync(subscription, payload, vapidDetails)`.
4. **Manejo de Errores (Limpieza):** Si el envío devuelve un error HTTP 410 (Gone) o 404 (Not Found), significa que el usuario desinstaló la PWA o revocó el permiso. El backend **debe** eliminar ese registro de `AgentPushSubscriptions` inmediatamente para mantener la base de datos limpia.

## 6. Siguientes Pasos
- Generación del par de claves VAPID.
- Creación de la migración en EF Core para la tabla `AgentPushSubscriptions`.
- Implementación del controlador de suscripciones en .NET.
- Implementación del Manifest y Service Worker en React.
