# Spec: 003-Modulo-Calendario (Calendario Profesional CRM)

## 1. Visión General
El Módulo de Calendario centraliza la gestión de tiempo del Agente Inmobiliario. Permite visualizar, programar y reprogramar interacciones críticas (visitas, llamadas, seguimientos) en una interfaz interactiva.

**Objetivo:** Eliminar la fricción en el agendamiento y proporcionar una vista holística de los compromisos del agente.

## 2. Modelo de Datos
Se ha optado por **reutilizar y extender** la entidad `TaskItem` en lugar de crear una tabla nueva.
**Justificación:** Las tareas y los eventos del calendario en un CRM inmobiliario son conceptualmente lo mismo (llamadas, visitas, reuniones). Mantener una sola tabla simplifica el filtrado por `AgenteId` (Scoping) y la gestión de estados (Pendiente, Completada, Cancelada).

### Cambios en `TaskItem.cs` (Entidad):
- `FechaInicio`: Renombrar `FechaVencimiento` o usar `FechaInicio` para mayor claridad en el calendario.
- `DuracionMinutos`: `int` (default 30). Permite calcular la `FechaFin` dinámicamente.
- `ColorHex`: `string(7)` para personalización visual en la UI.
- `EsTodoElDia`: `bool` (opcional).

### Relaciones:
- `AgenteId`: Requerido (Scoping JWT).
- `ClienteId`: Opcional (Vinculación con Prospecto).
- `PropiedadId`: Opcional (Vinculación con Inmueble para visitas).

## 3. API Endpoints (Vertical Slice)

### GET `/api/calendario?inicio=...&fin=...`
- **Filtros:** Rango de fechas obligatorio.
- **Scoping:** Filtrado estricto por `AgenteId` del token JWT.
- **Respuesta:** Lista de tareas con campos extendidos para el calendario.

### POST `/api/calendario`
- Creación rápida de eventos desde el calendario.
- Asignación automática de `AgenteId`.

### PATCH `/api/calendario/{id}/reprogramar`
- Optimizado para **Drag & Drop**.
- Solo actualiza `FechaInicio` y opcionalmente `DuracionMinutos`.
- Sigue el patrón `ExecuteUpdateAsync` para máximo rendimiento.

## 4. Interfaz de Usuario (Frontend)

### Librería Sugerida: `@fullcalendar/react`
- **Justificación:** Es el estándar de la industria, altamente maduro, soporta Drag & Drop nativo y tiene un plugin específico para React. Aunque es más pesado que alternativas como `react-calendar`, su robustez para vistas de Semana/Día y gestión de zonas horarias es superior.
- **Estilos:** Integración con Tailwind CSS mediante inyección de clases en los hooks de renderizado de FullCalendar.

### Funcionalidades:
- **Vistas:** Mes, Semana Laboral y Día.
- **Modales:** 
  - Click en espacio vacío -> Abrir `CrearTareaForm` con fecha/hora preseleccionada.
  - Click en evento -> Abrir `EditarTareaForm` o `DetalleTarea`.
- **Drag & Drop:** Al soltar un evento, se dispara una actualización optimista (Zero Wait Policy) y se llama al endpoint de reprogramación en segundo plano.

## 5. Sincronización Automática (Triggers de Negocio)
El cambio de etapa en un `LeadPropertyInterest` (Interés) debe generar eventos automáticos:
- **Etapa "Cita Programada":** Disparar la creación de un `TaskItem` tipo "Visita" vinculado al Cliente y Propiedad, con 60 min de duración por defecto.

## 6. UX & Performance (Standards)
- **SWR/Local Cache:** El calendario cargará instantáneamente los eventos del mes actual desde `localStorage` mientras valida con la API.
- **Optimistic UI:** El cambio de fecha vía Drag & Drop será instantáneo en la UI. Si la API falla, el evento "rebota" a su posición original con un Toast de error.
- **Confirmación Visual:** Al guardar un evento, el botón del modal mostrará un check verde por 800ms antes de cerrarse.

## 7. Próximos Pasos (Tareas Técnicas)
1. Migración de base de datos para extender `TaskItem`.
2. Implementación de `ActualizarTarea.cs` para el endpoint de reprogramación rápida.
3. Instalación de dependencias de FullCalendar en el frontend.
4. Creación del componente `CalendarioPrincipal.tsx` bajo `features/tareas`.
