# Spec: Copilot Context Interactions

## Intención
Aprovechar la existencia del contexto implícito del Copiloto para implementar una nueva herramienta (`ConsultarInteraccionesContacto`) y optimizar la existente (`ResumirHistorialContacto`), haciéndolas 100% token-efficient (sin parámetros de búsqueda) y aislando el acceso a la información para evitar exfiltración de datos.

## Enfoque
1. **Backend**:
   - Pasar una bandera `hasFocusedContext` a la inyección de definiciones de herramientas (`AiToolDefinitions`). 
   - Las herramientas `ConsultarInteraccionesContacto` y `ResumirHistorialContacto` **solo** se envían al LLM si el contexto está activo.
   - Enviar una regla en el prompt del sistema al LLM para indicarle al usuario usar el botón "Analizar con IA" si intenta acceder a herramientas de contacto de forma global.
   - Propagar `FocusedContextId` a través de `ToolExecutionContext`.
   - Implementar/modificar Handlers para que validen la existencia de `FocusedContextId` y extraigan los datos usando Entity Framework.

## Entregables
- [x] `ConsultarInteraccionesContactoHandler` creado y registrado en DI.
- [x] `ResumirHistorialContactoHandler` refactorizado para eliminar `searchTerm`.
- [x] `AgentAiStreamProcessor` adaptado para mapear IDs y enviar mensajes condicionales.
- [x] `AiToolDefinitions` optimizado para ahorrar tokens en las propiedades de las herramientas de contacto.
