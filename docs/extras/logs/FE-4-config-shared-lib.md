# Reporte de Auditoría de Logs — Configuración, Componentes Compartidos, Hooks, Lib y Store

**Generado:** 2026-07-05  
**Archivos escaneados:** 107  
**Áreas cubiertas:**
- `src/features/configuracion` — 71 archivos (.ts / .tsx)
- `src/components` — 25 archivos (.tsx / .ts)
- `src/hooks` — 6 archivos (.ts)
- `src/lib` — 3 archivos (.ts)
- `src/store` — 1 archivo (.ts)
- `src/App.tsx` — 1 archivo
- `src/main.tsx` — 1 archivo

**Total logs encontrados:** 15  
**Críticos 🔴:** 0 | **Advertencias 🟡:** 3 | **Revisar 🟢:** 12

---

## 🔴 CRÍTICOS — Eliminar Inmediatamente

> Sin hallazgos críticos en esta área. Ningún log expone PII, credenciales, tokens JWT ni payloads completos de usuario.

---

## 🟡 ADVERTENCIAS — Debug Residual / Estructura Interna Expuesta

### `src/components/GlobalErrorBoundary.tsx` — Líneas 26–30

```typescript
console.group('🚨 [GLOBAL_ERROR]');
console.error('Error:', error.message);
console.error('Stack:', error.stack);
console.error('Component Stack:', errorInfo.componentStack);
console.groupEnd();
```
**Riesgo:** Expone stack traces completos del runtime de React (`error.stack`, `errorInfo.componentStack`) a la consola del navegador. En producción, cualquier usuario con DevTools puede ver la estructura interna de componentes, rutas de archivos compilados y nombres de funciones internas. Esto revela arquitectura interna del sistema.  
**Acción:** ELIMINAR el bloque completo de `console.*`. Enviar el error a un sistema de monitoreo de errores (p.ej. Sentry) en su lugar. El estado `hasError` ya maneja la UI de repuesto — el logging a consola es innecesario en producción.

---

### `src/lib/swr.ts` — Línea 26

```typescript
console.warn('SWR Cache Lleno o QuotaExceededError. Limpiando caché local para liberar cuota.', error);
```
**Riesgo:** Expone el nombre de la clave de caché (`crm-swr-cache-v2`) y detalles de la arquitectura de persistencia local (patrón LRU, límite de 30 entradas) indirectamente a través del contexto del objeto `error` que puede contener la cadena JSON rechazada. Revela detalles de implementación interna del caché.  
**Acción:** ELIMINAR. El `catch` ya ejecuta `localStorage.removeItem(CACHE_KEY)` como recuperación silenciosa — el warning no aporta valor en producción y solo expone detalles internos. Si se desea telemetría, enviar a un servicio de monitoreo.

---

### `src/lib/axios.ts` — Línea 67

```typescript
console.error('Error al obtener la sesión de Supabase:', error);
```
**Riesgo:** En el interceptor de request, este log puede revelar detalles del objeto `error` devuelto por el cliente de Supabase en caso de fallos de autenticación. Dependiendo del error devuelto, podría exponer fragmentos de configuración de la sesión o mensajes de error del proveedor de autenticación. Contexto sensible: ocurre en el flujo de inyección del token JWT.  
**Acción:** ELIMINAR. El interceptor ya maneja el fallo silenciosamente (`sessionPromise = null`) y continúa; el error de sesión no requiere logging a consola. Usar monitoreo de APM si se requiere telemetría.

---

## 🟢 REVISAR — Logs Potencialmente Legítimos

### `src/features/configuracion/components/ActivarAgenteInvitadoModal.tsx` — Línea 42

```typescript
console.error('Error al cargar agencias:', err);
```
**Riesgo:** `err` es el objeto de error completo de la llamada a `listarAgencias()`. Según la estructura de respuesta del backend, podría incluir mensajes de respuesta HTTP con datos internos. Sin datos de usuario directamente expuestos en este log específico.  
**Acción:** REVISAR si `err` puede contener respuestas del servidor con información sensible. Si es solo un `Error` estándar, el riesgo es bajo. Considerar eliminar o reemplazar con manejo de errores vía `toast` (que ya existe en el flujo de error adyacente).

---

### `src/features/configuracion/components/InvitarAgenteForm.tsx` — Línea 26

```typescript
console.error('Error al cargar agencias:', err);
```
**Riesgo:** Idéntico al caso anterior — objeto `err` completo de `listarAgencias()`. Sin PII directa, pero potencialmente expone detalles de respuesta HTTP.  
**Acción:** REVISAR. Misma recomendación: evaluar si `err` puede contener payloads de respuesta del servidor. Considerar eliminar dado que el flujo ya maneja el error de forma silenciosa.

---

### `src/features/configuracion/hooks/useConfiguracionPortabilidadLogic.ts` — Línea 40

```typescript
console.error('Error al exportar datos:', error);
```
**Riesgo:** Ocurre en el flujo de exportación de datos (contactos/propiedades). El objeto `error` podría revelar detalles de la respuesta del servidor sobre el proceso de exportación. No contiene PII directa visible.  
**Acción:** REVISAR. Este log podría ser legítimo durante desarrollo, pero en producción el `toast.error` ya notifica al usuario. Considerar eliminar el `console.error` o reemplazarlo con telemetría de monitoreo.

---

### `src/components/DynamicSearchSelect.tsx` — Línea 91

```typescript
console.error('Error searching:', error);
```
**Riesgo:** Ocurre en el handler de búsqueda dinámica. El objeto `error` puede contener la query de búsqueda fallida y detalles de respuesta del servidor. Riesgo bajo si la búsqueda no involucra datos de usuarios.  
**Acción:** REVISAR. Componente genérico de búsqueda — sin PII directa, pero el objeto `error` completo puede exponer detalles de infraestructura. Considerar eliminar; el componente ya maneja el estado de error vía `setIsLoading(false)`.

---

### `src/hooks/usePushNotifications.ts` — Línea 43

```typescript
}).catch(console.error);
```
**Riesgo:** Callback `.catch(console.error)` en la suscripción de dispositivo push. Imprime el error completo del SDK de Push Notifications (puede incluir detalles del endpoint, configuración del Service Worker). Sin PII directa, pero expone arquitectura de push.  
**Acción:** REVISAR. Reemplazar con un handler explícito que no logge a consola en producción, o eliminar el catch pasivo.

---

### `src/hooks/usePushNotifications.ts` — Línea 44

```typescript
}).catch(console.error);
```
**Riesgo:** Segunda cadena `.catch(console.error)` en el flujo de suscripción de `pushManager.subscribe`. Puede revelar detalles del fallo de generación de la suscripción push (incluyendo la clave VAPID pública si el error la referencia).  
**Acción:** REVISAR. Mismo tratamiento que línea 43: reemplazar con handler explícito o eliminar.

---

### `src/hooks/usePushNotifications.ts` — Línea 104

```typescript
console.error('Error subscribing to push notifications:', error);
```
**Riesgo:** En catch del flujo principal de suscripción. El objeto `error` puede contener detalles del payload enviado al endpoint `/agente/dispositivos/suscribir` si la llamada API falla con respuesta de error estructurada.  
**Acción:** REVISAR. El `toast.error` ya notifica al usuario. Considerar eliminar el log de consola; si se necesita debugging, usar monitoreo de APM.

---

### `src/hooks/usePushNotifications.ts` — Línea 147

```typescript
console.error('Error resyncing push notifications:', error);
```
**Riesgo:** En catch del flujo de resincronización. Contexto similar al anterior — `error` puede contener detalles de la respuesta del servidor para `/agente/dispositivos/suscribir`.  
**Acción:** REVISAR. Eliminar o reemplazar con telemetría.

---

### `src/hooks/usePushNotifications.ts` — Línea 170

```typescript
console.error('Error unsubscribing from push notifications:', error);
```
**Riesgo:** En catch del flujo de desuscripción. El `error` puede incluir el endpoint del dispositivo (dato de infraestructura). Sin PII de usuario directa.  
**Acción:** REVISAR. Eliminar; el `toast.error` ya maneja la notificación al usuario.

---

### `src/hooks/useSpeechRecognition.ts` — Línea 40

```typescript
console.error('Speech recognition error:', event.error);
```
**Riesgo:** `event.error` es el código de error del Web Speech API (`not-allowed`, `network`, `no-speech`). Bajo riesgo — no contiene PII. Revela que el sistema usa reconocimiento de voz del navegador.  
**Acción:** REVISAR. El if/else posterior ya maneja cada error con `toast.*` apropiado. El log de consola es redundante en producción. Considerar eliminar.

---

### `src/hooks/useSpeechRecognition.ts` — Línea 65

```typescript
console.error('Error starting recognition:', e);
```
**Riesgo:** Objeto `e` de excepción al iniciar el reconocimiento de voz. Bajo riesgo de PII, pero expone estado interno del hook. Sin manejo alternativo visible (no hay toast en este catch).  
**Acción:** REVISAR. Evaluar añadir un `toast.error` y eliminar el `console.error`, o silenciar el error si es esperado (p.ej. ya estaba activo).

---

### `src/lib/axios.ts` — Línea 27

```typescript
console.error('Error al leer token de local storage', e);
```
**Riesgo:** Ocurre en el parsing de localStorage para recuperar el token de sesión. El objeto `e` (SyntaxError de JSON.parse) no contiene directamente el token, pero el contexto del log revela el patrón de almacenamiento de tokens (`sb-*-auth-token`), lo que podría ser útil para un atacante que tenga acceso a los logs de la consola.  
**Acción:** REVISAR. Riesgo bajo-medio. La función de lectura es sincrónica y crítica para el rendimiento del cliente. Considerar eliminar el log ya que el `return null` del catch ya maneja el fallo gracefully.

---

### `src/lib/supabase.ts` — Línea 7

```typescript
console.error('Missing Supabase environment variables');
```
**Riesgo:** Confirma que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` no están configuradas. No expone los valores en sí, pero revela los nombres de las variables de entorno esperadas por la aplicación.  
**Acción:** REVISAR. En producción, si las variables faltan la aplicación no funcionará de todos modos. Riesgo bajo — podría ser útil en desarrollo. Considerar dejarlo solo si existe algún mecanismo para suprimir logs en producción (`import.meta.env.DEV` check).

---

## Áreas Sin Hallazgos

Las siguientes áreas fueron escaneadas exhaustivamente y **no contienen ningún statement de logging**:

| Área | Archivos Escaneados | Resultado |
|------|---------------------|-----------|
| `src/features/configuracion/api/` | 11 archivos | ✅ Sin logs |
| `src/features/configuracion/components/` (resto) | 35 archivos | ✅ Sin logs |
| `src/features/configuracion/hooks/` (resto) | varios | ✅ Sin logs |
| `src/components/layout/` | 7 archivos | ✅ Sin logs |
| `src/components/ui/` | 8 archivos | ✅ Sin logs |
| `src/hooks/useDebounce.ts` | 1 archivo | ✅ Sin logs |
| `src/hooks/useGlobalContactoModalLogic.ts` | 1 archivo | ✅ Sin logs |
| `src/hooks/useIsMobile.ts` | 1 archivo | ✅ Sin logs |
| `src/hooks/useScrollButtons.ts` | 1 archivo | ✅ Sin logs |
| `src/store/useHelpDrawerStore.ts` | 1 archivo | ✅ Sin logs |
| `src/App.tsx` | 1 archivo | ✅ Sin logs |
| `src/main.tsx` | 1 archivo | ✅ Sin logs |

---

## Resumen Ejecutivo

El área de configuración, componentes compartidos, hooks, lib y store presenta un **nivel de riesgo BAJO-MEDIO** con **cero hallazgos críticos**. No se encontraron logs que expongan datos personales (PII), credenciales, tokens JWT, emails, teléfonos ni payloads completos de usuario.

Los 15 logs identificados son en su totalidad `console.error` o `console.warn` en bloques `catch`, lo cual indica buenas prácticas generales de manejo de errores. Sin embargo, hay **3 casos de advertencia** que requieren atención en producción:

1. **`GlobalErrorBoundary.tsx`** (🟡 ADVERTENCIA PRIORITARIA): Expone stack traces completos de React incluyendo `error.stack` y `errorInfo.componentStack` — revela arquitectura interna significativa. Debe migrarse a Sentry u otro sistema de monitoreo.

2. **`lib/axios.ts` — línea 67** (🟡 ADVERTENCIA): En el flujo crítico de autenticación JWT, expone el objeto de error de Supabase Auth que puede contener información sensible de la sesión.

3. **`lib/swr.ts` — línea 26** (🟡 ADVERTENCIA): Expone detalles de la arquitectura de caché local y el nombre de clave interna `crm-swr-cache-v2`.

Los 12 logs restantes en categoría 🟢 son `console.error` en catch blocks sin PII directa, pero deben evaluarse para eliminar en producción dado que los toasts y el manejo de estado ya cubren los casos de error. La recomendación global es implementar un guard de entorno (`if (import.meta.env.DEV)`) o migrar todos los logs de error a una solución de monitoreo centralizada como Sentry.
