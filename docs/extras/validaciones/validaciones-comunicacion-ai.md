# Validaciones para Entidades de Comunicación e IA

A continuación se detallan las propuestas de validación para los campos editables y creables por el usuario para las entidades de IA y comunicación omnicanal (WhatsApp, Facebook Messenger, Copilot).

## Campo: `Title`
- **Entidad:** AgentConversation
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `.NotEmpty().WithMessage("El título es obligatorio.").MaximumLength(100).WithMessage("El título no puede exceder los 100 caracteres.");`
- **Reglas Frontend (Zod):** `z.string().min(1, "El título es obligatorio").max(100, "Máximo 100 caracteres")`
- **Notas de negocio:** Puede ser generado automáticamente por la IA basándose en el contexto del primer mensaje.

## Campo: `Content`
- **Entidad:** AgentMessage
- **Tipo:** string
- **Obligatorio:** Sí
- **Reglas Backend (FluentValidation):** `.NotEmpty().WithMessage("El contenido del mensaje no puede estar vacío.");`
- **Reglas Frontend (Zod):** `z.string().min(1, "El mensaje no puede estar vacío")`
- **Notas de negocio:** El cuerpo del mensaje en la conversación con el agente.

---

## Campos Excluidos

- `Id` (Todas las entidades): Excluido por ser un identificador generado automáticamente por la base de datos o el sistema al momento de crear el registro (`Guid.NewGuid()`).
- `CreatedAt`, `UpdatedAt`, `UltimaActualizacion`, `Fecha` (Todas las entidades): Excluidos porque registran automáticamente las estampillas de tiempo (timestamps) de los eventos y no deben ser proveídos ni modificados externamente por cuestiones de auditoría.
- `HistorialJson` (WhatsappConversation, FacebookConversation): Excluido porque representa el estado condensado de la memoria del chat gestionado automáticamente por la lógica de negocio para inyectar al LLM; no es un campo de ingreso manual.
- `Agent`, `AgentConversation`, `Contacto` (Propiedades de Navegación): Excluidos por tratarse de relaciones del Entity Framework Core y no campos escalares que deban validarse en los DTOs de entrada convencionales.

**Campos gestionados automáticamente por el sistema o integraciones (no editables por el usuario en formularios):**
- `AgentId` (AgentConversation): Se asigna automáticamente para identificar al agente participante.
- `AgentConversationId` (AgentMessage): Se asigna automáticamente para enlazar el mensaje con su hilo de conversación.
- `Role` (AgentMessage): Se asigna automáticamente para definir si el mensaje proviene del usuario, de la IA, o del sistema.
- `ContactoId` (WhatsappConversation, WhatsappMessage, FacebookMessage, FacebookConversation, AiActionLog): Se asigna o resuelve automáticamente según el remitente.
- `Telefono` (WhatsappConversation, WhatsappMessage): Se obtiene automáticamente a partir de la integración de WhatsApp.
- `AgenteId` (WhatsappMessage, FacebookConversation, FacebookMessage): Se asigna automáticamente según el agente responsable.
- `Rol` (WhatsappMessage, FacebookMessage): Se asigna automáticamente para determinar la dirección del mensaje (usuario/asistente).
- `OrigenMensaje` (WhatsappMessage, FacebookMessage): Se asigna automáticamente.
- `Contenido` (WhatsappMessage, FacebookMessage): Se recibe mediante webhooks de la integración, no es un ingreso manual en el frontend del CRM.
- `FacebookSenderId` (FacebookConversation, FacebookMessage): Se obtiene automáticamente del webhook (PSID).
- `PageId` (FacebookConversation): Se obtiene automáticamente del webhook.
- `TelefonoContacto` (AiActionLog): Se asigna automáticamente para enlazar la acción.
- `Accion` (AiActionLog): Definida automáticamente por la función de negocio detonada.
- `DetalleJson` (AiActionLog): Payload generado automáticamente por el LLM.
- `TriggerMessage` (AiActionLog): El mensaje original que detonó la acción, registrado automáticamente.
- `Canal` (AiActionLog): Asignado automáticamente según el origen de la conversación (WhatsApp, Facebook, Copilot).
