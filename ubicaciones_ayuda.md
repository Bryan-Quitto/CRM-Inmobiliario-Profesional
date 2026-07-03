# Mapa de Ubicaciones de los Botones de Ayuda (`<HelpButton>`)

A continuación se detalla dónde se encuentran los accesos a los manuales de ayuda en toda la aplicación, qué título tienen y qué archivo Markdown de ayuda cargan. Se ha comprobado en todo el código base que la función interna `openHelp` se llama exclusivamente a través del componente `<HelpButton>`.

## Analítica y Dashboard
- **Componentes**: 
  - `src/features/analitica/components/AnaliticaViewDesktop.tsx`
  - `src/features/analitica/components/AnaliticaViewMobile.tsx`
  - `src/features/dashboard/components/EmbudoVentas.tsx`
  - `src/features/dashboard/components/KpiCards.tsx`
  - `src/features/dashboard/components/SeguimientoCritico.tsx`
- **Título**: Analítica y Dashboard / Embudo de Ventas / Métricas y Analítica / Seguimiento Crítico
- **Manual vinculado**: `/docs/manuales/manual_analitica.md`

## Productividad y Organización
- **Componentes**:
  - `src/features/calendario/components/CalendarioViewMobile.tsx`
  - `src/features/calendario/components/calendario-sections/CalendarioHeader.tsx`
  - `src/features/tareas/components/agenda-panel-sections/AgendaHeader.tsx`
- **Título**: Productividad y Organización
- **Manual vinculado**: `/docs/manuales/manual_productividad.md`

## Inteligencia Artificial
- **Componentes**:
  - `src/features/configuracion/components/ConfiguracionIntegracionIADesktop.tsx`
  - `src/features/configuracion/components/ConfiguracionIntegracionIAMobile.tsx`
  - `src/features/copilot/components/CopilotDrawerDesktop.tsx`
  - `src/features/copilot/components/CopilotDrawerMobile.tsx`
- **Título**: Configuración de IA / Inteligencia Artificial
- **Manual vinculado**: `/docs/manuales/manual_ia.md`

## Comunicaciones y Auditoría (WhatsApp, Facebook, Logs IA)
- **Componentes**:
  - `src/features/configuracion/components/ConfiguracionIntegracionIADesktop.tsx` (WhatsApp / IA del Sistema)
  - `src/features/configuracion/components/ConfiguracionIntegracionIAMobile.tsx` (WhatsApp / IA del Sistema)
  - `src/features/configuracion/components/FacebookIntegracionTab.tsx` (Facebook Messenger)
  - `src/features/ia/components/IaLogsLayoutDesktop.tsx` (Auditoría Sistema)
  - `src/features/ia/components/IaLogsLayoutMobile.tsx` (Auditoría Sistema)
- **Título**: Integración con WhatsApp / IA del Sistema (Personal) / Integración con Facebook Messenger / Auditoría Sistema
- **Manual vinculado**: `/docs/manuales/manual_comunicaciones.md`

## Administración y Configuración
- **Componentes**:
  - `src/features/configuracion/components/ConfiguracionLayoutDesktop.tsx`
  - `src/features/configuracion/components/ConfiguracionLayoutMobile.tsx`
- **Título**: Administración y Configuración
- **Manual vinculado**: `/docs/manuales/manual_administracion.md`

## Contactos y CRM
- **Componentes**:
  - `src/features/contactos/components/contactos-list-sections/ContactosListFilters.tsx`
  - `src/features/contactos/components/contactos-list-sections/ContactosListMobileFilters.tsx`
- **Título**: Contactos y CRM
- **Manual vinculado**: `/docs/manuales/manual_contactos.md`

## Búsqueda y Herramientas (Omnisearch)
- **Componentes**:
  - `src/features/omnisearch/components/CommandPaletteDesktop.tsx`
  - `src/features/omnisearch/components/CommandPaletteMobile.tsx`
- **Título**: Búsqueda y Herramientas
- **Manual vinculado**: `/docs/manuales/manual_busqueda.md`

## Base de Conocimiento Institucional
- **Componentes**:
  - `src/features/propiedades/components/propiedad-detalle-sections/DetalleFaqManager.tsx`
- **Título**: Base de Conocimiento Institucional
- **Manual vinculado**: `/docs/manuales/manual_knowledge.md`

## Propiedades e Inventario
- **Componentes**:
  - `src/features/propiedades/components/propiedades-list-sections/PropiedadesFilters.tsx`
- **Título**: Propiedades e Inventario
- **Manual vinculado**: `/docs/manuales/manual_propiedades.md`

## Ayudas con Contenido Directo (Sin archivo Markdown)
- **Componente**: `src/features/contactos/components/contacto-detalle-sections/ContactoInterestsManager.tsx`
- **Título**: Niveles de Interés
- **Contenido**: Muestra una explicación textual directa mediante la propiedad `content` (sin usar `path`), explicando la temperatura de los prospectos (Alto, Medio, Bajo).
