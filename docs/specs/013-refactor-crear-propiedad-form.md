# Spec 013: Refactorización y Modularización del Formulario de Propiedades

## Propósito
Dividir el componente `CrearPropiedadForm.tsx` (actualmente >1000 líneas) en una arquitectura modular basada en componentes de sección y hooks personalizados. El objetivo es mejorar la mantenibilidad, reducir la carga cognitiva para futuros cambios y optimizar el rendimiento mediante renderizados granulares.

## Requerimientos Técnicos

### 1. Arquitectura de Orquestación
- El componente `CrearPropiedadForm` **DEBE** actuar únicamente como orquestador.
- **DEBE** inicializar `react-hook-form` y proveer el contexto mediante un `<FormProvider />` para evitar el "prop drilling" excesivo.
- **DEBE** centralizar la lógica de envío (`onSubmit`) para garantizar la integridad de los datos (Ecuador UTC-5 y preservación de `0`).

### 2. Extracción de Lógica (Hooks)
- **usePropertyDraft**: El sistema **DEBE** persistir borradores automáticamente en `localStorage` solo en modo creación.
- **useVoiceDictation**: El sistema **DEBE** encapsular la interacción con el API de `SpeechRecognition`.
- **useRemaxScraper**: El sistema **DEBE** gestionar el estado de carga y los campos resaltados (`missedFields`) tras la importación.

### 3. Componentización de Secciones
El formulario **DEBE** dividirse en los siguientes sub-componentes:
- **ImportSection**: Gestión de URL Remax.
- **BasicInfoSection**: Título, descripción y tipo de propiedad.
- **LocationSection**: Datos geográficos y Google Maps.
- **TechnicalSpecsSection**: Áreas, habitaciones, baños y servicios.
- **CommissionSection**: Lógica de captación propia y búsqueda de agentes.

### 4. Preservación de Lógica Crítica (Inquebrantables)
- **Timezone**: El sistema **DEBE** mantener el manejo de fechas en `UTC-5` (Ecuador).
- **Zero-Preservation**: El sistema **DEBE** asegurar que valores numéricos como `0` en parqueaderos o áreas se envíen correctamente al servidor.
- **Optimistic Feedback**: El sistema **DEBE** mantener la política de "Zero Wait" cerrando el modal inmediatamente tras el envío exitoso.

## Escenarios de Prueba

### Escenario: Persistencia de Borrador
- **GIVEN** Un usuario está creando una nueva propiedad.
- **WHEN** El usuario escribe en el campo "Título" y recarga la página.
- **THEN** El formulario **DEBE** restaurar el texto ingresado desde `localStorage`.

### Escenario: Importación Inteligente
- **GIVEN** Un usuario pega una URL de Remax.
- **WHEN** El usuario hace clic en "Autocompletar".
- **THEN** Los componentes de sección correspondientes **DEBEN** actualizar sus campos y resaltar los datos faltantes en amarillo.

### Escenario: Gestión de Captador Externo
- **GIVEN** El usuario desmarca "¿Captación propia?".
- **WHEN** El usuario selecciona "Seleccionar de la lista".
- **THEN** El `CommissionSection` **DEBE** mostrar el buscador `DynamicSearchSelect` filtrando agentes activos.

## Matriz de Impacto
- **Estado Comercial**: No se ve afectado.
- **Validaciones**: Se mantienen mediante `react-hook-form` en cada sección.
- **Mantenibilidad**: Se espera una reducción del 70% en el tamaño del archivo principal.
