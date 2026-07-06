# Reporte de Auditoría de Logs — Frontend (Contactos, Propiedades, Tareas)

**Generado:** 2026-07-05
**Archivos escaneados:** Recursivo en `src/features/contactos`, `src/features/propiedades`, `src/features/tareas` (.ts, .tsx)
**Total logs encontrados:** 46
**Críticos 🔴:** 2 | **Advertencias 🟡:** 6 | **Revisar 🟢:** 38

---

## 🔴 CRÍTICOS — Eliminar Inmediatamente

### `CRM_Inmobiliario_Web/src/features/contactos/api/getContactos.ts` — Línea 31
```typescript
  console.log(`[API] /contactos (Frontend) tardó ${(end - start).toFixed(2)} ms con params:`, restParams);
```
**Riesgo:** Expone los parámetros de búsqueda de la API (`restParams`), los cuales pueden contener nombres de clientes, números de teléfono o correos electrónicos (PII).
**Acción:** ELIMINAR / REEMPLAZAR con una métrica de performance que excluya la impresión de los parámetros.

### `CRM_Inmobiliario_Web/src/features/propiedades/components/crear-propiedad-sections/BasicInfoSection.tsx` — Línea 18
```typescript
  console.log('[DEBUG] BasicInfoSection - Current values in Context:', getValues());
```
**Riesgo:** Loguea un objeto completo del formulario (`getValues()`), lo que expone todos los datos ingresados de la propiedad, potencialmente incluyendo información del propietario u otros datos sensibles.
**Acción:** ELIMINAR (Debug residual con datos del usuario).

---

## 🟡 ADVERTENCIAS — Debug Residual

### `CRM_Inmobiliario_Web/src/features/contactos/api/getDropdownContactos.ts` — Línea 23
```typescript
  console.log(`[getDropdownContactos] fetching URL: /contactos/dropdown${url.search}, Contexto: ${contexto}`);
```
**Riesgo:** Seguimiento de flujo que podría exponer parámetros del query string innecesariamente en producción.
**Acción:** ELIMINAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/components/crear-propiedad-sections/TechnicalSpecsSection.tsx` — Línea 14
```typescript
  console.log('[DEBUG] TechnicalSpecsSection - tipoSeleccionado:', tipoSeleccionado);
```
**Riesgo:** Mensaje de debugging obvio dejado en producción.
**Acción:** ELIMINAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/components/crear-propiedad-sections/TechnicalSpecsSection.tsx` — Línea 15
```typescript
  console.log('[DEBUG] TechnicalSpecsSection - habitaciones:', getValues('habitaciones'));
```
**Riesgo:** Mensaje de debugging obvio.
**Acción:** ELIMINAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/usePropertyCommercialLogic.ts` — Línea 41
```typescript
      console.warn('[COMMERCIAL] Revalidation skipped or failed after unmount', e);
```
**Riesgo:** Exposición de estados internos y arquitectura de componentes al cliente.
**Acción:** ELIMINAR o convertir en un log seguro centralizado.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/usePropertyDraft.ts` — Línea 18
```typescript
      console.log('[DEBUG] usePropertyDraft - Saving to localStorage');
```
**Riesgo:** Mensaje de tracking obvio sin valor para el usuario final.
**Acción:** ELIMINAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/usePropertyDraft.ts` — Línea 24
```typescript
    console.log('[DEBUG] usePropertyDraft - Clearing localStorage');
```
**Riesgo:** Mensaje de tracking obvio.
**Acción:** ELIMINAR.

---

## 🟢 REVISAR — Logs Potencialmente Legítimos

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useCompartirContacto.ts` — Línea 24
```typescript
      console.error('Error al compartir contacto:', err);
```
**Riesgo:** Error genérico en catch block. Evaluar si el stack trace del error podría estar exponiéndose al cliente.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useCompartirContacto.ts` — Línea 39
```typescript
      console.error('Error al revocar visibilidad:', err);
```
**Riesgo:** Error genérico en catch block.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useContactoBotToggle.ts` — Línea 53
```typescript
      console.error(error);
```
**Riesgo:** Volcado directo del error a consola, posible filtración de stack trace.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useContactoBotToggle.ts` — Línea 72
```typescript
      console.error(error);
```
**Riesgo:** Volcado directo del error a consola, posible filtración de stack trace.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useContactoCommercialLogic.ts` — Línea 44
```typescript
      console.error('Error al actualizar etapa:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useContactoCommercialLogic.ts` — Línea 74
```typescript
      console.error('Error al revertir estado:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useContactoInterests.ts` — Línea 46
```typescript
      console.error('Error al vincular propiedad:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useContactoInterests.ts` — Línea 72
```typescript
      console.error('Error al actualizar interés:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useContactoInterests.ts` — Línea 98
```typescript
      console.error('Error al desvincular:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useContactoTimeline.ts` — Línea 77
```typescript
      console.error('Error al guardar nota:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useContactoTimeline.ts` — Línea 109
```typescript
      console.error('Error al eliminar nota:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useCrearContacto.ts` — Línea 37
```typescript
        console.error('Error al parsear borrador:', e);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useCrearContacto.ts` — Línea 167
```typescript
      console.error('Error al guardar contacto en background:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useCrearContacto.ts` — Línea 236
```typescript
      console.error('Error validando teléfono:', e);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/contactos/hooks/useMergeContactosLogic.ts` — Línea 61
```typescript
      console.error(error);
```
**Riesgo:** Volcado directo del error.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/components/MediaCard.tsx` — Línea 67
```typescript
        actualizarDescripcionMultimedia(item.id, descripcionRef.current || null).catch(console.error);
```
**Riesgo:** Volcado directo del error devuelto por la promesa a la consola.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/components/MediaCard.tsx` — Línea 120
```typescript
        console.error('Error auto-guardando descripción:', error);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/useClosingModal.ts` — Línea 164
```typescript
      console.error('Error al procesar el cierre:', error);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/useCrearPropiedad.ts` — Línea 91
```typescript
        } catch (e) { console.error('Error al parsear borrador:', e); }
```
**Riesgo:** Error genérico de parsing.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/useCrearPropiedad.ts` — Línea 160
```typescript
      console.error('Error al guardar propiedad:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/useGalleryCore.ts` — Línea 40
```typescript
      console.error('Error al descargar:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/useGalleryCore.ts` — Línea 66
```typescript
      console.error('Error al crear ZIP:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/usePropertyCommercialLogic.ts` — Línea 141
```typescript
        console.error(`[COMMERCIAL] Error en cierre:`, error);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/useRemaxScraper.ts` — Línea 55
```typescript
      console.error('Error al importar:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/useSectionalGallery.ts` — Línea 76
```typescript
        onRenameSection(sectionId, nombreRef.current, descripcionRef.current || null).catch(console.error);
```
**Riesgo:** Volcado directo del error a consola.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/propiedades/hooks/useUploadManager.ts` — Línea 102
```typescript
        console.error(`Error subiendo ${file.name}:`, err);
```
**Riesgo:** Error genérico, puede incluir detalles del error del archivo subido.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/context/TareasProvider.tsx` — Línea 56
```typescript
      console.error('Error en updateTarea optimista:', e);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/context/TareasProvider.tsx` — Línea 77
```typescript
      console.error('Error en addTarea optimista:', e);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useAgendaActions.ts` — Línea 38
```typescript
      console.error('Error al completar tarea en background:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useAgendaActions.ts` — Línea 65
```typescript
      console.error('Error al cancelar tarea en background:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useAgendaPanelLogic.ts` — Línea 74
```typescript
        console.error('[CommandParser] Error resolviendo contacto:', e);
```
**Riesgo:** Error genérico del parser de comandos.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useAgendaPanelLogic.ts` — Línea 88
```typescript
        console.error('[CommandParser] Error resolviendo propiedad:', e);
```
**Riesgo:** Error genérico del parser.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useComandoPanel.ts` — Línea 80
```typescript
        console.error('Speech recognition error:', event.error);
```
**Riesgo:** Error devuelto por la API del navegador.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useComandoPanel.ts` — Línea 99
```typescript
        console.error('Error starting recognition:', e);
```
**Riesgo:** Error al iniciar el reconocimiento de voz.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useCrearTarea.ts` — Línea 84
```typescript
        console.error('Error al parsear borrador de tarea:', e);
```
**Riesgo:** Error genérico de parsing.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useCrearTarea.ts` — Línea 127
```typescript
      console.error('Error en sync de addTarea:', err);
```
**Riesgo:** Error genérico de sincronización.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useEditarTarea.ts` — Línea 138
```typescript
        console.error('Error al cargar tarea:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

### `CRM_Inmobiliario_Web/src/features/tareas/hooks/useEditarTarea.ts` — Línea 180
```typescript
      console.error('Error en sync de updateTarea:', err);
```
**Riesgo:** Error genérico.
**Acción:** REVISAR.

---

## Resumen Ejecutivo
Se han escaneado los módulos de **Contactos, Propiedades y Tareas** del Frontend. Se encontraron 46 statements de logs en total. Existe un alto nivel de disciplina en el uso de `console.error` para capturar excepciones silenciosamente (38 casos, que deben revisarse para asegurar que no exponen stack traces), sin embargo, se identificaron **2 casos críticos** de exposición directa de datos: parámetros de búsqueda completos en la API de contactos y volcados del contexto completo (`getValues()`) del formulario de propiedades. Estos deben eliminarse urgentemente para evitar fugas de PII o estructura de dominio. Además, hay varios logs residuales marcados con `[DEBUG]` que deben purgarse antes de liberar la versión a producción.
