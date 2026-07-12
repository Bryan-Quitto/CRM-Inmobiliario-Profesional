# Validaciones Propuestas: Tareas y Calendario

A continuación, se detallan las validaciones propuestas para los campos de la entidad `TaskItem` que son creados o editados directamente por el usuario desde el frontend o a través de la API.

## Campo: `Titulo`
- **Entidad:** TaskItem
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `NotEmpty()`, `MaximumLength(150)`
- **Reglas Frontend (Zod):** `z.string().min(1, "El título es obligatorio").max(150, "El título no puede exceder los 150 caracteres")`
- **Notas de negocio:** Debe ser descriptivo para identificar rápidamente el propósito de la tarea en la vista de calendario.

## Campo: `Descripcion`

- **Entidad:** TaskItem
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(500)` (Recomendado para evitar textos excesivamente largos en base de datos)
- **Reglas Frontend (Zod):** `z.string().max(500, "La descripción es demasiado larga").optional().nullable()`
- **Notas de negocio:** Se usa para guardar notas previas a la reunión, comentarios o el detalle completo de la tarea.

## Campo: `TipoTarea`

- **Entidad:** TaskItem
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `NotEmpty()`, `MaximumLength(50)`, validar contra la lista permitida: "Llamada", "Visita", "Reunión", "Trámite".
- **Reglas Frontend (Zod):** `z.enum(["Llamada", "Visita", "Reunión", "Trámite"])`
- **Notas de negocio:** Sirve para categorizar las tareas, aplicar filtros y asignar íconos o badges en el calendario.

## Campo: `FechaInicio`
- **Entidad:** TaskItem
- **Tipo:** DateTimeOffset
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `NotEmpty()`
- **Reglas Frontend (Zod):** `z.date({ required_error: "La fecha de inicio es obligatoria" })` o `z.string().datetime()` si se envía como ISO string.
- **Notas de negocio:** Determina la ubicación de la tarea dentro del calendario. 

## Campo: `ColorHex`
- **Entidad:** TaskItem
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(7)`, `Matches("^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$")` (validación de formato HEX).
- **Reglas Frontend (Zod):** `z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Color inválido").optional().nullable()`
- **Notas de negocio:** Permite la personalización visual de los eventos en el calendario según la preferencia del agente.

## Campo: `Lugar`
- **Entidad:** TaskItem
- **Tipo:** string
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** `MaximumLength(255)`
- **Reglas Frontend (Zod):** `z.string().max(255, "El lugar no puede exceder los 255 caracteres").optional().nullable()`
- **Notas de negocio:** Puede contener una dirección física (para visitas), un link de Google Maps o un enlace de videollamada (Zoom/Meet).

## Campo: `Estado`
- **Entidad:** TaskItem
- **Tipo:** string
- **Obligatorio:** Sí (con valor por defecto "Pendiente")
- **Reglas Backend (FluentValidation):** `NotEmpty()`, `MaximumLength(50)`, validar contra la lista permitida: "Pendiente", "Completada", "Cancelada".
- **Reglas Frontend (Zod):** `z.enum(["Pendiente", "Completada", "Cancelada"])`
- **Notas de negocio:** Fundamental para la trazabilidad y métricas de productividad. En el frontend, el estado se puede modificar haciendo "check" en la tarea.

## Campo: `ContactoId`
- **Entidad:** TaskItem
- **Tipo:** Guid?
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** Si tiene valor, validar que no sea un `Guid.Empty`. (A nivel de comandos, verificar que exista en la DB).
- **Reglas Frontend (Zod):** `z.string().uuid("ID de contacto inválido").optional().nullable()`
- **Notas de negocio:** Vincula la tarea directamente a un cliente o prospecto dentro del CRM para tener un historial centralizado.

## Campo: `PropiedadId`
- **Entidad:** TaskItem
- **Tipo:** Guid?
- **Obligatorio:** No
- **Reglas Backend (FluentValidation):** Si tiene valor, validar que no sea un `Guid.Empty`. (A nivel de comandos, verificar que exista en la DB).
- **Reglas Frontend (Zod):** `z.string().uuid("ID de propiedad inválida").optional().nullable()`
- **Notas de negocio:** Vincula la tarea a una propiedad específica, ideal cuando la tarea es de tipo "Visita".

---

## Campos Excluidos

Los siguientes campos han sido excluidos de la validación del usuario final ya que son gestionados o generados internamente por el sistema:

- **`Id`**: Clave primaria autogenerada (UUID/Guid) en la base de datos o manejada por el ORM.
- **`AgenteId`**: Se asume que se asigna automáticamente leyendo el ID del usuario logueado en el contexto de seguridad (claims del token JWT) desde el Backend para evitar que un agente suplante o manipule tareas de otro por error. *(Si el sistema admite asignar tareas a otros agentes, se requeriría validarlo).*
- **`NotificacionesEnviadas`**: Campo interno que utiliza el sistema/worker en background para saber cuántos avisos se han disparado por esta tarea.
- **`UltimaNotificacionEnviada`**: Fecha y hora controlada por el job de recordatorios para no enviar alertas repetidas.
- **`FechaCreacion`**: Campo de auditoría (`DateTimeOffset.UtcNow`) seteado implícitamente al instanciar o guardar la entidad.
- **`DuracionMinutos`**: Este campo no lo puede asignar el usuario al crear la tarea, siempre se inicializa por defecto con 30 minutos.
