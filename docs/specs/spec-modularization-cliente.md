# SDD: Refactorización Modular Quirúrgica - ClienteDetalle.tsx

## 1. Objetivo
Modularizar el componente `ClienteDetalle.tsx` (~915 líneas) para aislar la gestión del perfil del cliente, el timeline de interacciones y la lógica de vinculación de propiedades. Se busca mantener la fidelidad de la **Zero Wait Policy** y el **UPSP (Ultra-Premium Sync Pattern)**.

## 2. Clasificación
**Tipo:** Orquestador de Prospectos (Module Group).
**Riesgo:** MEDIO-ALTO (Afecta el embudo de ventas y la analítica del dashboard).

## 3. Arquitectura Propuesta

### Carpeta de Destino
`src/features/clientes/components/cliente-detalle-sections/`

### Componentes a Extraer
1.  **`useClienteDetalle.ts` (Hook):**
    - SWR Fetching: Cliente, Propiedades (para vinculación).
    - Handlers: `handleStageChange`, `handleSaveNota`, `handleVincularPropiedad`, `handleRevertStatus`.
    - States: Notas en edición, modales de reversión, filtros de timeline.
2.  **`ClienteHeader.tsx`:** Navegación, nombre del cliente, etapa del embudo (con dropdown) y botones de contacto rápido.
3.  **`ClienteProfileCard.tsx`:** Información básica (Email, Teléfono, Origen, Fecha de Registro) y metadatos de captador.
4.  **`ClienteTimelineManager.tsx`:**
    - `NotaInput.tsx`: Input especializado con selector de tipo (WhatsApp, Llamada, etc.).
    - `TimelineList.tsx`: El feed de interacciones con filtros de búsqueda y tipo.
    - `TimelineItem.tsx`: Renderizado individual de notas con edición inline.
5.  **`ClienteInterestsManager.tsx`:**
    - `VincularPropiedadSelector.tsx`: Integración con `DynamicSearchSelect`.
    - `InterestsList.tsx`: Listado de propiedades de interés con niveles (Alto, Medio, Bajo).
6.  **`ClienteModalsOrchestrator.tsx`:** Modales de Cierre, Reversión de Estado y Confirmación de Borrado.

## 4. Estrategia de Validación Quirúrgica
- **Verificación de Revalidación SWR:** Confirmar que `globalMutate` siga disparando las actualizaciones de KPIs en el Dashboard tras cada interacción.
- **UX de Transiciones:** Validar que el retraso de 800ms en el éxito de vinculación se mantenga para "Satisfy Transitions".
- **Filtros de Timeline:** Asegurar que la lógica de filtrado local no pierda reactividad al moverse a sub-componentes.

---
*Nota: Este documento sirve como guía para la ejecución en la siguiente sesión.*
