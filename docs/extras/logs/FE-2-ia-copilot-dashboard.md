# Reporte de Auditoría de Logs — FE: IA · Copilot · Dashboard · Omnisearch

**Generado:** 2026-07-05
**Archivos escaneados:** 70
**Total logs encontrados:** 7
**Críticos 🔴:** 1 | **Advertencias 🟡:** 2 | **Revisar 🟢:** 4

> Áreas auditadas:
> - `CRM_Inmobiliario_Web/src/features/ia` — 37 archivos (.ts / .tsx)
> - `CRM_Inmobiliario_Web/src/features/copilot` — 13 archivos (.ts / .tsx)
> - `CRM_Inmobiliario_Web/src/features/dashboard` — 14 archivos (.ts / .tsx)
> - `CRM_Inmobiliario_Web/src/features/omnisearch` — 6 archivos (.ts / .tsx)

---

## 🔴 CRÍTICOS — Eliminar Inmediatamente

### `CRM_Inmobiliario_Web/src/features/ia/hooks/useConversacionIAFacebook.ts` — Línea 27

```typescript
console.log(`[DEBUG] Llamando a endpoint de facebook: /ia/facebook-conversacion/${encodedPsid}?skip=${skip}&take=10`);
```

**Riesgo:** Expone en consola el **PSID de Facebook** del cliente (identificador único de usuario de Meta, equivalente a un ID personal vinculado a perfil social). El valor `encodedPsid` proviene directamente de `psid`, que identifica de manera inequívoca a un contacto/lead real. Cualquier persona con acceso a DevTools del navegador puede capturar este identificador. Esto puede violar GDPR/LOPD al exponer identificadores de personas físicas sin control de acceso. Adicionalmente, el log revela la ruta interna de la API y la estructura de paginación del backend.

**Acción:** ELIMINAR completamente. Si se necesita trazabilidad de llamadas HTTP en desarrollo, usar una variable de entorno `VITE_DEBUG_API=true` con un guard condicional, o instrumentación de red via interceptores de Axios que no toquen la consola del navegador.

---

## 🟡 ADVERTENCIAS — Debug Residual

### `CRM_Inmobiliario_Web/src/features/copilot/hooks/useCopilotChat.ts` — Línea 143

```typescript
console.log('Generación de IA abortada por el usuario');
```

**Riesgo:** Log de seguimiento de flujo interno sin datos sensibles. No expone PII, pero es debug residual de desarrollo que no aporta valor en producción. Hace visible en consola el comportamiento interno del sistema de streaming de IA (que el usuario puede abortar), revelando arquitectura del módulo copilot.

**Acción:** ELIMINAR. El estado de cancelación ya se refleja en la UI mediante `overwriteLastMessage('*(Generación cancelada)*')`, por lo que el log no cumple ninguna función operativa.

---

### `CRM_Inmobiliario_Web/src/features/ia/hooks/useInteresesIA.ts` — Línea 26

```typescript
console.error('Error al actualizar interés:', err);
```

**Riesgo:** El objeto `err` (variable del catch) puede contener stack traces del servidor, mensajes de error con rutas internas de la API, o detalles de la respuesta HTTP que revelan estructura del backend. Sin que el error sea filtrado o sanitizado, se vuelca íntegro a la consola del navegador.

**Acción:** EVALUAR → si `err` es siempre un `AxiosError` con respuesta controlada, el riesgo es bajo. Si puede contener datos de request/response completos, ELIMINAR y reemplazar por: `console.error('Error al actualizar interés:', err instanceof Error ? err.message : 'Unknown error')`. O simplemente eliminar, dado que `toast.error(...)` ya notifica al usuario.

---

## 🟢 REVISAR — Logs Potencialmente Legítimos

### `CRM_Inmobiliario_Web/src/features/ia/hooks/useInteresesIA.ts` — Línea 44

```typescript
console.error('Error al eliminar interés:', err);
```

**Riesgo:** Mismo patrón que línea 26. El objeto `err` del catch puede contener información del servidor (stack trace, respuesta HTTP completa). Está en un bloque catch de operación de negocio crítica (eliminación de vínculo contacto-propiedad).

**Acción:** REVISAR → verificar qué estructura tiene `err` en tiempo de ejecución. Si `err` puede contener `err.response.data` con payload de entidad, ELIMINAR o sanitizar. El `toast.error(...)` ya cubre la notificación al usuario, haciendo el `console.error` redundante.

---

### `CRM_Inmobiliario_Web/src/features/copilot/hooks/useCopilotChat.ts` — Línea 33

```typescript
console.error('Error loading conversation:', error);
```

**Riesgo:** El objeto `error` surge de una llamada para cargar historial de conversación del Copilot. Si la respuesta de error del servidor incluye fragmentos del payload (e.g., mensajes de conversación, ID de usuario), quedarían expuestos en consola. El comentario adyacente `// Fallback for UI if error` confirma que este log es solo de desarrollo.

**Acción:** REVISAR → confirmar que `error` no contiene datos de conversación o tokens en su estructura. Si el riesgo se confirma, ELIMINAR. El bloque catch ya maneja el fallback de UI sin necesitar el log.

---

### `CRM_Inmobiliario_Web/src/features/copilot/hooks/useCopilotDrawerLogic.ts` — Línea 146

```typescript
console.error('Error reset tokens:', e);
```

**Riesgo:** Log en el catch de reset de tokens de usuario. El objeto `e` podría contener detalles de la respuesta de la API de tokens. Bajo riesgo si el error es genérico, pero el contexto (tokens de IA personales) amerita verificación.

**Acción:** REVISAR → confirmar que `e` no expone información sobre el saldo o límites de tokens del usuario. Si está limpio, es aceptable; idealmente ELIMINAR dado que `toast.error(...)` ya notifica al usuario.

---

### `CRM_Inmobiliario_Web/src/features/copilot/hooks/useCopilotDrawerLogic.ts` — Línea 160

```typescript
console.error('Error sending message:', e);
```

**Riesgo:** Log en el catch del envío de mensajes al Copilot. El objeto `e` podría contener el payload del mensaje enviado o la respuesta de error del stream. Dado que los mensajes del usuario pueden incluir datos de contactos, propiedades o leads (PII en contexto de CRM), si `e` incluye el body del request (`e.config.data`), esto sería un riesgo CRÍTICO encubierto.

**Acción:** REVISAR URGENTE → inspeccionar en runtime si `e` puede incluir `e.config.data` (body del request con el mensaje del usuario). Si es así, escalar a 🔴 CRÍTICO y ELIMINAR inmediatamente. En cualquier caso, `toast.error(...)` y `setInputValue(message)` ya manejan el fallback correctamente sin necesidad del log.

---

## Resumen Ejecutivo

El área auditada presenta **riesgo moderado con un caso crítico claro**. De los 70 archivos escaneados en 4 features, solo **7 logs** fueron encontrados, concentrados en 4 archivos de hooks. Las áreas **dashboard** (14 archivos) y **omnisearch** (6 archivos) están completamente limpias — cero logs.

El caso más grave es el **PSID de Facebook** en `useConversacionIAFacebook.ts` (línea 27): es un identificador personal directo de un usuario de Meta expuesto en consola del navegador, lo que constituye una violación potencial de GDPR/LOPD sin paliativos. Debe eliminarse de inmediato.

Los 4 logs clasificados como 🟢 REVISAR involucran objetos de error (`err`, `error`, `e`) volcados íntegros en catch blocks. En el contexto del Copilot (que maneja mensajes de usuario sobre leads y propiedades), existe riesgo real de que `AxiosError.config.data` exponga payloads con datos sensibles de PII. Se recomienda una revisión de runtime de la estructura de estos errores antes de la próxima release a producción.

**Acciones inmediatas recomendadas:**
1. Eliminar log de PSID (`useConversacionIAFacebook.ts`, línea 27) — **URGENTE**
2. Eliminar debug de abort (`useCopilotChat.ts`, línea 143)
3. Auditar en runtime los objetos de error en los 4 casos 🟢 del Copilot e `ia/hooks` — programar dentro del mismo sprint
