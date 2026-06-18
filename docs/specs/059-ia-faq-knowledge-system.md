# Spec 059: Sistema de FAQs y Resolución IA en 4 Capas

## 1. Contexto y Objetivo

Este spec documenta el sistema de Preguntas Frecuentes (FAQs) por propiedad y el refactor del sistema de IA a 4 capas de resolución, incluyendo la escalación silenciosa de 5 minutos.

**Cambios implementados:**
- Módulo CRUD de FAQs por propiedad con workflow de estados y permisos por rol
- Enriquecimiento del contexto LLM con FAQs aprobadas (nueva capa 2)
- Escalación silenciosa: la IA espera 5 minutos antes de notificar al cliente
- Auto-complete de tarea cuando el agente responde directamente

**Dependencia:** Spec 058 (auditoría de mensajes salientes con `OrigenMensaje`)

---

## Dominio 1: FAQs de Propiedad

### Requirement: Entidad PropertyFaq con workflow de estados

El sistema MUST gestionar FAQs de propiedad con ciclo de vida: `Borrador → En Revisión → Aprobada/Rechazada → Desactivada`.
Cada FAQ MUST tener: `Pregunta (string)`, `Respuesta (string)`, `PropiedadId (Guid)`, `CreadoPorId (Guid)`, `Estado (enum)`, `NotaRechazo (string?)`.

#### Scenario: Agente autorizado crea FAQ directamente Aprobada
- GIVEN un agente es el agente asignado de la propiedad (o creador de la transacción activa si no hay agente asignado) y la propiedad está activa
- WHEN crea una FAQ
- THEN la FAQ se persiste con estado `Aprobada` directamente, sin pasar por revisión

#### Scenario: Agente no autorizado crea FAQ en Borrador
- GIVEN un agente no es el agente autorizado de la propiedad
- WHEN crea una FAQ
- THEN la FAQ se persiste con estado `Borrador`

#### Scenario: Cancelar Borrador
- GIVEN una FAQ está en estado `Borrador`
- WHEN el creador cancela/elimina la FAQ
- THEN se aplica hard delete; no queda registro en el sistema

### Requirement: Transiciones de estado y permisos

El agente autorizado MUST ser el único con permisos de Update y Delete sobre FAQs aprobadas/activas. Otros agentes MUST tener solo lectura en estados distintos de `Borrador` propio o `Rechazada` propia.

#### Scenario: Envío a revisión
- GIVEN una FAQ está en `Borrador` y el creador no es agente autorizado
- WHEN el creador envía a revisión
- THEN el estado cambia a `En Revisión`; el agente autorizado puede aprobar o rechazar

#### Scenario: Aprobación por agente autorizado
- GIVEN una FAQ está en `En Revisión`
- WHEN el agente autorizado la aprueba
- THEN el estado cambia a `Aprobada`

#### Scenario: Rechazo con nota obligatoria
- GIVEN una FAQ está en `En Revisión`
- WHEN el agente autorizado la rechaza sin proveer nota
- THEN la operación MUST ser rechazada con error de validación
- WHEN el agente autorizado la rechaza con nota
- THEN el estado cambia a `Rechazada`, `NotaRechazo` se persiste, y se envía notificación push al creador

#### Scenario: Desactivar FAQ Aprobada
- GIVEN una FAQ está `Aprobada`
- WHEN el agente autorizado la desactiva
- THEN el estado cambia a `Desactivada` (soft delete; registro conservado)

#### Scenario: Reactivar FAQ Desactivada
- GIVEN una FAQ está `Desactivada`
- WHEN el agente autorizado la reactiva
- THEN el estado vuelve a `Aprobada`

#### Scenario: Edición de FAQ Rechazada
- GIVEN una FAQ está `Rechazada` y el usuario es el creador
- WHEN edita pregunta o respuesta
- THEN los cambios se persisten; el estado permanece `Rechazada` hasta nuevo envío a revisión

#### Scenario: Intento de edición no autorizado
- GIVEN una FAQ está `Aprobada` o `En Revisión`
- WHEN un agente no autorizado intenta editarla
- THEN la operación MUST ser rechazada con 403

---

## Dominio 2: Resolución IA — 4 capas (delta)

### Requirement: FAQs como capa 2 en resolución IA (WhatsApp y Facebook)

El sistema MUST resolver consultas de clientes en 4 capas ordenadas:
1. Campos de propiedad (`ConsultarDetallesPropiedad`)
2. FAQs aprobadas de la propiedad (enriquecidas en el mismo response)
3. Base de conocimiento corporativo (`ConsultarBaseConocimiento`)
4. Escalación silenciosa (solo WA y FB)

`PropertyFaqContextEnricher` MUST añadir la sección `--- PREGUNTAS FRECUENTES ---` al contexto LLM. `ConsultarDetallesPropiedadHandler` MUST permanecer bajo 200 líneas delegando a este enricher.

#### Scenario: Propiedad con FAQs aprobadas
- GIVEN una propiedad tiene FAQs en estado `Aprobada`
- WHEN el LLM consulta detalles de esa propiedad
- THEN el contexto incluye sección `--- PREGUNTAS FRECUENTES ---` con pares pregunta/respuesta

#### Scenario: Propiedad sin FAQs aprobadas
- GIVEN una propiedad no tiene FAQs `Aprobadas`
- WHEN el LLM consulta detalles
- THEN el contexto NO incluye la sección de FAQs; sin error

### Requirement: Escalación silenciosa de 5 minutos (WA y FB)

`SolicitarAsistenciaHumanaHandler` MUST NOT enviar respuesta inmediata al cliente. MUST crear un `TaskItem` + notificación push al agente + job Hangfire programado a 5 minutos. Los campos `PendingEscalamientoJobId (string?)` y `PendingEscalamientoTareaId (Guid?)` MUST almacenarse en `Contacto`.

#### Scenario: Escalación disparada por LLM
- GIVEN un cliente consulta algo que supera las 3 capas IA en WA o FB
- WHEN `SolicitarAsistenciaHumanaHandler` se ejecuta
- THEN se crea `TaskItem` pendiente, notificación push al agente, y job Hangfire a 5 minutos; el cliente NO recibe mensaje inmediato

#### Scenario: Timer job al dispararse — tarea aún pendiente
- GIVEN han pasado 5 minutos y la tarea sigue en estado `Pendiente`
- WHEN `EscalamientoTimerJob` se ejecuta
- THEN el cliente recibe mensaje: "En unos momentos el agente [nombre] le ayudará con esa información."

#### Scenario: Timer job al dispararse — tarea ya completada
- GIVEN el agente completó la tarea antes de 5 minutos
- WHEN `EscalamientoTimerJob` se ejecuta
- THEN no se envía mensaje al cliente; se limpian campos de escalación en `Contacto`

### Requirement: Auto-complete de tarea al enviar mensaje el agente (delta Spec 058)

Cuando `OrigenMensaje == "AgenteHumano"` en `WhatsAppMessageSender` o `FacebookMessageSender`, el sistema MUST verificar si `Contacto.PendingEscalamientoJobId != null`. Si existe: MUST cancelar el job Hangfire, marcar la tarea como completada, y limpiar los campos `PendingEscalamientoJobId` y `PendingEscalamientoTareaId` en `Contacto`.

#### Scenario: Agente responde antes del timer
- GIVEN `Contacto.PendingEscalamientoJobId` tiene valor y la tarea está `Pendiente`
- WHEN el agente envía un mensaje por WA o FB
- THEN el job se cancela, la tarea se completa, los campos en `Contacto` se limpian; el cliente NO recibe el mensaje automático de 5 minutos

#### Scenario: Sin escalación pendiente
- GIVEN `Contacto.PendingEscalamientoJobId` es null
- WHEN el agente envía un mensaje
- THEN no se realiza ninguna acción de escalación; flujo normal

---

## Dominio 3: UI de Propiedad (delta)

### Requirement: Tab "IA" en vista de detalle de propiedad

`PropiedadDetalle.tsx` MUST gestionar un estado `useState<'detalle' | 'ia'>`. `DetalleHeader.tsx` MUST renderizar pill buttons "Detalles | IA" que alternan este estado. Cuando el tab IA está activo, MUST mostrarse el CRUD de FAQs de la propiedad. UI MUST estar en español. Tab visible para todos los agentes.

#### Scenario: Acceso al tab IA
- GIVEN el usuario está en la vista de detalle de una propiedad
- WHEN hace clic en el tab/botón "IA"
- THEN la vista cambia a la interfaz de gestión de FAQs de esa propiedad

#### Scenario: Acceso al tab Detalle
- GIVEN el tab IA está activo
- WHEN el usuario hace clic en "Detalle"
- THEN la vista vuelve a la información de la propiedad

### Requirement: Tooltip en configuración de notificaciones

En la sección `notifyAiHelpTasks*` de `/configuracion/notificaciones`, MUST mostrarse un tooltip explicando el comportamiento de escalación silenciosa de 5 minutos.

#### Scenario: Tooltip visible
- GIVEN el usuario está en `/configuracion/notificaciones`
- WHEN pasa el cursor sobre el ícono de ayuda en la sección `notifyAiHelpTasks*`
- THEN se muestra el tooltip con la explicación de la escalación silenciosa

---

## 5. Archivos implementados

### Backend (`CRM_Inmobiliario.Api/`)
| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `Domain/Entities/PropertyFaq.cs` | Nuevo | Entidad con 5 estados y navegaciones |
| `Domain/Entities/Contacto.cs` | Modificado | +PendingEscalamientoJobId, +PendingEscalamientoTareaId |
| `Infrastructure/Persistence/CrmDbContext.cs` | Modificado | +DbSet PropertyFaqs, índice compuesto |
| `Features/Faqs/CrearFaq.cs` | Nuevo | POST /api/propiedades/{id}/faqs |
| `Features/Faqs/ListarFaqs.cs` | Nuevo | GET /api/propiedades/{id}/faqs (filtrado por rol, OutputCache 30s) |
| `Features/Faqs/EditarFaq.cs` | Nuevo | PUT /api/faqs/{id} |
| `Features/Faqs/EnviarARevision.cs` | Nuevo | POST /api/faqs/{id}/enviar-revision |
| `Features/Faqs/AprobarFaq.cs` | Nuevo | POST /api/faqs/{id}/aprobar |
| `Features/Faqs/RechazarFaq.cs` | Nuevo | POST /api/faqs/{id}/rechazar |
| `Features/Faqs/DesactivarFaq.cs` | Nuevo | POST /api/faqs/{id}/desactivar |
| `Features/Faqs/ReactivarFaq.cs` | Nuevo | POST /api/faqs/{id}/reactivar |
| `Features/Faqs/EliminarBorrador.cs` | Nuevo | DELETE /api/faqs/{id} |
| `Features/Propiedades/PropertyFaqContextEnricher.cs` | Nuevo | Clase estática que formatea FAQs para el LLM |
| `Features/Propiedades/PropertyPermissionsHelper.cs` | Modificado | +CanManageFaq() |
| `Features/CoreAi/Tools/ConsultarDetallesPropiedadHandler.cs` | Modificado | Capa 2 FAQs integrada (180 líneas) |
| `Features/CoreAi/Tools/SolicitarAsistenciaHumanaHandler.cs` | Modificado | Escalación silenciosa + Hangfire (156 líneas) |
| `Features/CoreAi/Jobs/EscalamientoTimerJob.cs` | Nuevo | Job Hangfire con 2 guards y envío dual WA/FB |
| `Features/WhatsApp/Services/WhatsAppMessageSender.cs` | Modificado | Auto-complete al responder agente |
| `Features/Facebook/Services/FacebookMessageSender.cs` | Modificado | Auto-complete al responder agente |
| `Features/WhatsApp/Services/Prompts/SystemPromptFactory.cs` | Modificado | Silencio post-escalación |
| `Features/Facebook/Services/FacebookAiService.cs` | Modificado | Silencio post-escalación |

### Frontend (`CRM_Inmobiliario_Web/src/`)
| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `features/propiedades/types/faq.types.ts` | Nuevo | FaqEstado, PropertyFaq, DTOs |
| `features/propiedades/hooks/useFaqLogic.ts` | Nuevo | SWR + 8 mutaciones optimistas |
| `features/propiedades/components/.../FaqCard.tsx` | Nuevo | Card con badges por estado y botones contextuales |
| `features/propiedades/components/.../FaqFormModal.tsx` | Nuevo | Modal tri-modo: crear/editar/rechazar |
| `features/propiedades/components/.../DetalleFaqManager.tsx` | Nuevo | Orquestador con loading/empty states |
| `features/propiedades/components/PropiedadDetalle.tsx` | Modificado | Tab state + renderizado condicional |
| `features/propiedades/components/.../DetalleHeader.tsx` | Modificado | Pill buttons Detalles | IA |
| `features/configuracion/components/ConfiguracionNotificaciones.tsx` | Modificado | Tooltip escalación 5 minutos |

---

## 6. Smoke tests pendientes (manuales)

- **T5.3** — Crear FAQ como agente no autorizado → Borrador → Revisión → Aprobada → verificar en contexto LLM
- **T5.4** — Escalar en WA/FB → verificar silencio 5 min → mensaje auto → auto-complete al responder agente
