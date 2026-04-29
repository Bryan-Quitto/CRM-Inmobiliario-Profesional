# SDD: Refactorización Modular Quirúrgica - PropiedadDetalle.tsx

## 1. Objetivo
Reducir la complejidad cognitiva y técnica del componente `PropiedadDetalle.tsx` (1333 líneas) mediante su descomposición en un hook de lógica y componentes de sección especializados. El objetivo es mejorar la mantenibilidad por IA y humanos, asegurando **Cero Regresiones** en los patrones de UX (Optimistic UI, Undo Pattern).

## 2. Clasificación
**Tipo:** Orquestador masivo (Module Group).
**Riesgo:** ALTO (Maneja estados comerciales, flujos de cierre y transacciones críticas).

## 3. Arquitectura Propuesta

### Carpeta de Destino
`src/features/propiedades/components/propiedad-detalle-sections/`

### Componentes a Extraer
1.  **`usePropiedadDetalle.ts` (Hook):**
    - Abstrae: SWR fetching (Propiedad + Historial), Mutate local.
    - Handlers: `handleStatusChange`, `handleWhatsAppShare`, `handleClosingConfirm`, `handleDeleteMedia`, `handleReorder`, `handleDeleteTransaction`.
    - States: Modales, menús abiertos, estados de carga.
2.  **`DetalleHeader.tsx`:** Acciones superiores (Cerrar, PDF, WhatsApp, Editar, Dropdown de Estado).
3.  **`DetalleHeroInfo.tsx`:** Título, Badges (Tipo, Operación, Captación), Ubicación y Precio.
4.  **`DetalleStatsGrid.tsx`:** Grid reactivo de estadísticas (Área, Habitaciones, Baños, etc.) con filtrado por tipo de propiedad.
5.  **`DetalleContentLayout.tsx`:** Descripción y Google Maps dinámico (incluye lógica de `getMapEmbedUrl`).
6.  **`DetalleGalleryManager.tsx`:** Orquestación de `SectionalGallery`, lógica de `DragDropContext` e inserción inline de secciones.
7.  **`DetalleHistoryTimeline.tsx`:** Renderizado del historial (Spec 011), `InlineNoteEditor` y lógica de reversión de estados.
8.  **`DetalleModalsOrchestrator.tsx`:** Punto único para `ClosingModal`, `CrearPropiedadForm` (edit mode) y modales de advertencia.

## 4. Estrategia de Validación Quirúrgica
- **Verificación de Tipado:** Asegurar que `Propiedad` y `PropertyTransactionResponse` fluyan correctamente a través de Props.
- **Persistencia de UX:** Validar que los TOASTS y los tiempos del `Undo Pattern` (5s/6s) se mantengan idénticos.
- **Sincronización:** Comprobar que los `mutate()` del hook afecten correctamente a todos los sub-componentes.

---
*Nota: Este documento sirve como guía para la ejecución en la siguiente sesión.*
