# Reporte de Auditoría de Logs — FE-3: Analítica · Calendario · Auth · Legal · Manuales

**Generado:** 2026-07-05  
**Áreas escaneadas:** `analitica`, `calendario`, `auth`, `legal`, `manuales`  
**Archivos .ts/.tsx escaneados:** 82  
**Total logs encontrados:** 14  
**Críticos 🔴:** 4 | **Advertencias 🟡:** 0 | **Revisar 🟢:** 10

---

## 🔴 CRÍTICOS — Eliminar Inmediatamente

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useConfirmarInvitacion.ts` — Línea 109

```typescript
console.error(err);
```

**Riesgo:** Este `catch` captura el error completo del flujo `handleActivate`, que incluye la llamada a `supabase.auth.updateUser({ password: formData.password, data: { nombre, apellido, telefono } })` y la llamada API `POST /configuracion/activar-perfil` con nombre, apellido, teléfono y agenciaId. El objeto `err` puede contener en sus propiedades internas (`err.config`, `err.request`) la contraseña del usuario en texto plano (enviada en el payload de Supabase Auth) y datos personales (nombre, apellido, teléfono) como parte de la respuesta/request capturada en el objeto de error de Axios/Supabase.  
**Acción:** ELIMINAR. El error ya es manejado con `toast.error` y `setError`. No se requiere logging de consola.

---

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useConfirmarInvitacionLogic.ts` — Línea 113

```typescript
console.error(err);
```

**Riesgo:** Idéntico al caso anterior (`useConfirmarInvitacion.ts`). Este es el hook duplicado (versión "Logic") del mismo flujo de activación de perfil con contraseña y datos personales. El objeto `err` puede contener datos sensibles: contraseña en el payload de `supabase.auth.updateUser`, y nombre/apellido/teléfono en el payload de `api.post('/configuracion/activar-perfil', ...)`. Violación potencial de GDPR/LOPD por exposición de credenciales en consola del navegador.  
**Acción:** ELIMINAR. El error ya es manejado por `setError(msg)` y `toast.error('Error de activación')`.

---

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useLoginFormLogic.ts` — Línea 38

```typescript
console.error(err);
```

**Riesgo:** Este `catch` cubre el bloque `supabase.auth.signInWithPassword({ email, password })`. En caso de un error inesperado de red o de la librería, el objeto `err` de Supabase/fetch puede incluir la URL con el email, el token de autenticación parcial o el body de la request (con email y password). Se está en el flujo más crítico del sistema (login), donde cualquier dato expuesto en consola puede ser capturado por extensiones del navegador, herramientas de monitoreo, o sesiones de DevTools abiertas.  
**Acción:** ELIMINAR. El error de autenticación normal ya se maneja por el `if (authError)` anterior. Este `catch` es solo para errores inesperados; silenciarlo es seguro.

---

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useActualizarClaveLogic.ts` — Línea 47

```typescript
console.error(err);
```

**Riesgo:** Este `catch` cubre `supabase.auth.updateUser({ password: password })`. El objeto de error de Supabase puede retener referencias al request original que incluye la nueva contraseña del usuario en su payload. Loguear este objeto en consola expone potencialmente la contraseña en texto claro en las DevTools del navegador.  
**Acción:** ELIMINAR. El flujo ya maneja el `authError` y el `setError` es suficiente para informar al usuario.

---

## 🟡 ADVERTENCIAS — Debug Residual

> No se encontraron logs de tipo advertencia (debug residual sin datos sensibles) en ninguna de las áreas escaneadas.

---

## 🟢 REVISAR — Logs Potencialmente Legítimos

### `CRM_Inmobiliario_Web/src/features/calendario/hooks/useCalendario.ts` — Línea 66

```typescript
console.error('Error al cancelar tarea:', err);
```

**Contexto:** Dentro de un `catch` en `handleCancelar`. El parámetro `err` es el error genérico de una llamada API (`cancelarTarea(id)`). El `id` de la tarea no es PII directo, pero sí un identificador de sistema. El objeto `err` podría contener stack traces o respuestas de API con información interna.  
**Riesgo:** Bajo — no parece capturar datos de usuario directamente. Sin embargo, `err` completo podría exponer URLs de API internas o estructura de respuesta.  
**Acción:** REVISAR. Reemplazar por `console.error('Error al cancelar tarea:', (err as Error).message)` para limitar la superficie expuesta, o eliminar si el `toast.error` es suficiente notificación.

---

### `CRM_Inmobiliario_Web/src/features/calendario/hooks/useCalendario.ts` — Línea 85

```typescript
console.error('Error al completar tarea:', err);
```

**Contexto:** Dentro de un `catch` en `handleCompletar`. Similar al caso anterior — llama a `completarTarea(id)` importada dinámicamente. El `err` podría exponer detalles de la API interna.  
**Riesgo:** Bajo — sin PII directa identificada, pero expone arquitectura interna de la API (rutas, estructura de respuestas).  
**Acción:** REVISAR. Considerar eliminar o limitar a `(err as Error).message` para evitar exponer la estructura del sistema.

---

### `CRM_Inmobiliario_Web/src/features/calendario/hooks/useCalendario.ts` — Línea 147

```typescript
console.error('Error al reprogramar evento:', error);
```

**Contexto:** Dentro del `.catch()` de `reprogramarEvento(event.id, { fechaInicio, duracionMinutos })`. El objeto `error` podría contener detalles de la API de reprogramación.  
**Riesgo:** Bajo — sin PII directa. El `event.id` es un identificador interno. El objeto `error` podría revelar rutas API internas si es un error de Axios.  
**Acción:** REVISAR. Reemplazar por `console.error('Error al reprogramar evento:', (error as Error).message)` o eliminar dado que ya existe `toast.error(...)`.

---

### `CRM_Inmobiliario_Web/src/features/auth/components/FotoPerfilUpload.tsx` — Línea 34

```typescript
console.error('Error comprimiendo imagen:', error);
```

**Contexto:** Dentro del bloque de compresión de imagen con `imageCompression`. El objeto `error` aquí proviene de la librería de compresión (`browser-image-compression`), no de una API. No debería contener datos personales del usuario.  
**Riesgo:** Muy bajo — `error` de la librería de compresión es un error técnico de procesamiento de imagen, no contiene PII. Sin embargo, sigue siendo un log de consola visible en producción.  
**Acción:** REVISAR. Aceptable como log de error técnico, pero considerar eliminarlo en producción ya que la función hace fallback silencioso (`return file`).

---

### `CRM_Inmobiliario_Web/src/features/auth/components/LogoAgenciaUpload.tsx` — Línea 34

```typescript
console.error('Error comprimiendo logo:', error);
```

**Contexto:** Idéntico al caso de `FotoPerfilUpload.tsx`. Error de la librería de compresión de imágenes para el logo de agencia. No contiene PII.  
**Riesgo:** Muy bajo — mismo análisis que el caso anterior.  
**Acción:** REVISAR. Considerar eliminar en producción.

---

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useConfiguracionPerfil.ts` — Línea 110

```typescript
console.error('Error al actualizar perfil:', err);
```

**Contexto:** Dentro del `catch` de `handleSyncProfile`. La llamada es a `actualizarPerfil({ ...formData, agenciaId })`. El `formData` contiene datos del perfil del usuario (nombre, apellido, teléfono, etc.). Si el error de Axios retiene el request config, el objeto `err` podría contener estos datos personales en `err.config.data`.  
**Riesgo:** Medio — el objeto `err` de Axios puede contener el payload completo del perfil (PII) en su propiedad `config.data`. Esto lo acerca al nivel CRÍTICO dependiendo de la implementación de Axios.  
**Acción:** REVISAR con urgencia. Reemplazar por `console.error('Error al actualizar perfil:', (err as Error).message)` o eliminar, dado que ya existe manejo con `toast.error`.

---

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useConfiguracionPerfilLogic.ts` — Línea 115

```typescript
console.error('Error al actualizar perfil:', err);
```

**Contexto:** Duplicado del hook anterior (`useConfiguracionPerfil.ts`). Mismo flujo, mismo riesgo — `actualizarPerfil({ ...formData, agenciaId })` con datos personales del usuario en el payload.  
**Riesgo:** Medio — igual que el caso anterior. Objeto `err` de Axios puede retener PII del payload.  
**Acción:** REVISAR con urgencia. Mismo tratamiento que el caso anterior.

---

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useConfirmarInvitacion.ts` — Línea 27

```typescript
console.warn('No se pudo recuperar el usuario de la sesión actual');
```

**Contexto:** Log de flujo de diagnóstico cuando `supabase.auth.getUser()` falla o no retorna usuario. No contiene PII — solo un mensaje de texto estático.  
**Riesgo:** Bajo — no expone datos personales. Revela que el sistema usa Supabase Auth para gestión de sesiones.  
**Acción:** REVISAR. Eliminar en producción para no revelar arquitectura interna. El fallo es silencioso (solo `return`), lo cual es el comportamiento correcto.

---

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useConfirmarInvitacion.ts` — Línea 42

```typescript
console.error('Error al inicializar datos de invitación:', err);
```

**Contexto:** Dentro del `catch` de `checkMetadata`. La llamada previa incluye `api.get(\`/configuracion/agencias/${agencyId}\`)`. El `err` de Axios podría contener el `agencyId` en la URL del request. El `agencyId` es un identificador interno de agencia (no PII de usuario), pero sí revela estructura del sistema.  
**Riesgo:** Bajo-Medio — `agencyId` es un UUID interno. El objeto `err` completo de Axios podría exponer la URL interna de la API.  
**Acción:** REVISAR. Reemplazar por `console.error('Error al inicializar datos de invitación:', (err as Error).message)`.

---

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useConfirmarInvitacionLogic.ts` — Línea 30

```typescript
console.warn('No se pudo recuperar el usuario de la sesión actual');
```

**Contexto:** Duplicado del mismo log en `useConfirmarInvitacion.ts`. Mismo análisis — mensaje estático sin PII, pero revela arquitectura de sesión.  
**Riesgo:** Bajo.  
**Acción:** REVISAR. Eliminar en producción.

---

### `CRM_Inmobiliario_Web/src/features/auth/hooks/useConfirmarInvitacionLogic.ts` — Línea 45

```typescript
console.error('Error al inicializar datos de invitación:', err);
```

**Contexto:** Duplicado del mismo log en `useConfirmarInvitacion.ts`. Mismo análisis — `err` de Axios podría exponer la URL con `agencyId`.  
**Riesgo:** Bajo-Medio.  
**Acción:** REVISAR. Reemplazar por `console.error('Error al inicializar datos de invitación:', (err as Error).message)`.

---

### `CRM_Inmobiliario_Web/src/features/legal/components/TermsOfServiceModal.tsx` — Línea 21

```typescript
console.error(error);
```

**Contexto:** Dentro del `catch` del handler `handleAccept`, que llama a `api.patch('/configuracion/perfil/terminos', { version: currentVersion })`. El objeto `error` de Axios podría incluir headers de autenticación (Authorization Bearer token) o el payload `{ version }` en `error.config`.  
**Riesgo:** Bajo-Medio — el payload es solo una cadena de versión (`currentVersion`), no PII directa. Sin embargo, el objeto `error` completo de Axios puede exponer el header `Authorization` con el JWT del usuario, lo cual es crítico.  
**Acción:** REVISAR con urgencia. Reemplazar por `console.error('Error al aceptar términos:', (error as Error).message)` o eliminar, dado que ya existe `toast.error`.

---

## Áreas sin Logs

Las siguientes áreas escaneadas no presentan ningún statement de logging:

- **`analitica`** — 0 logs encontrados en 13 archivos (.ts/.tsx)
- **`manuales`** — 0 logs encontrados en todos los archivos de componentes

---

## Resumen Ejecutivo

El área de **`auth`** concentra la mayoría del riesgo con **12 de 14 logs totales**, incluyendo los **4 casos CRÍTICOS** que deben eliminarse inmediatamente. Los más graves son los `console.error(err)` sin mensaje en `useLoginFormLogic.ts`, `useActualizarClaveLogic.ts`, `useConfirmarInvitacion.ts` y `useConfirmarInvitacionLogic.ts`: estos ocurren en catch blocks que cubren flujos de autenticación y cambio de contraseña, donde el objeto de error completo de Supabase/Axios puede retener en memoria referencias al payload original (email, contraseña, datos personales) e imprimirlos en la consola del navegador.

Dos casos de riesgo medio merecen revisión urgente: los `console.error('Error al actualizar perfil:', err)` en `useConfiguracionPerfil.ts` y `useConfiguracionPerfilLogic.ts`, donde `err` de Axios podría contener en `err.config.data` el JSON serializado de los datos personales del usuario (nombre, apellido, teléfono, agenciaId).

El área de **`calendario`** tiene 3 logs de riesgo bajo en operaciones no relacionadas con PII. Las áreas de **`analitica`** y **`manuales`** están completamente limpias.

**Patrón sistémico identificado:** La duplicación de hooks (ej. `useConfirmarInvitacion.ts` + `useConfirmarInvitacionLogic.ts`, `useConfiguracionPerfil.ts` + `useConfiguracionPerfilLogic.ts`) genera bugs de log duplicados. Cualquier corrección debe aplicarse en ambos archivos simultáneamente.
