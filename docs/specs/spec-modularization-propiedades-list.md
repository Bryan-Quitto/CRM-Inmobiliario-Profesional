# SDD: Refactorización Modular Quirúrgica - PropiedadesList.tsx

## 1. Objetivo
Modularizar el componente `PropiedadesList.tsx` (~805 líneas) para separar la lógica de filtrado (Fuse.js), el resumen estadístico del catálogo y la gestión de estados comerciales. Se busca mejorar la claridad del orquestador de la lista principal.

## 2. Clasificación
**Tipo:** Isla de Lista (Standalone Orchestrator).
**Riesgo:** MEDIO (Afecta la visibilidad y búsqueda principal de inmuebles).

## 3. Arquitectura Propuesta

### Carpeta de Destino
`src/features/propiedades/components/propiedades-list-sections/`

### Componentes a Extraer
1.  **`usePropiedadesList.ts` (Hook):**
    - SWR Fetching: Listado de propiedades.
    - Lógica de Búsqueda: Implementación de `Fuse.js` y filtros por estado/tipo.
    - Handlers: `handleStatusChange`, `handleOpenDetail`, `handleCloseDetail`.
2.  **`PropiedadesStatsHeader.tsx`:** El componente `PropertyStats` (Total, Venta, Alquiler) con sus estilos Tailwind específicos.
3.  **`PropiedadesFilters.tsx`:** Barra de búsqueda, dropdown de filtros de estado y botón de "Nueva Propiedad".
4.  **`PropiedadCard.tsx`:** Renderizado individual de la tarjeta de propiedad (incluye el dropdown de cambio de estado rápido y badges).
5.  **`PropiedadesSkeletonList.tsx`:** Abstracción del estado de carga (`SkeletonPropertyCard` repetido).
6.  **`PropiedadesModalsOrchestrator.tsx`:** Orquestación de `ClosingModal`, `CrearPropiedadForm` (edit mode) y `PropiedadDetalle`.

## 4. Estrategia de Validación Quirúrgica
- **Efectividad de Búsqueda:** Validar que `Fuse.js` mantenga su precisión en el filtrado de múltiples campos (Sector, Ciudad, Título).
- **Consistencia de URL:** Asegurar que el patrón de `searchParams` para abrir/cerrar detalles siga funcionando (Permite compartir enlaces directos a propiedades).
- **Status Badges:** Verificar que el cambio de color dinámico según el estado (`ESTADOS`) se mantenga íntegro.

---
*Nota: Este documento sirve como guía para la ejecución en la siguiente sesión.*
