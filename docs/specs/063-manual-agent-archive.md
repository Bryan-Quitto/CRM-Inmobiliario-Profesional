# Spec: Archivado Manual por Agente (Read-Only State y Filtrado)

## Resumen
Implementación de un sistema de archivado aislado por agente, donde cada agente puede archivar contactos y propiedades de su vista personal sin afectar los catálogos de los demás agentes de la inmobiliaria. Se aplica un diseño "Read-Only" para registros archivados, impidiendo mutaciones en la interfaz y respaldado por validaciones en el backend.

## Arquitectura de Datos (Backend - .NET)
- **Nuevas Entidades**: `AgentArchivedContact` (AgentId, ContactoId, ArchivedAt) y `AgentArchivedProperty` (AgentId, PropiedadId, ArchivedAt).
- Se priorizó un diseño de dos tablas separadas en lugar de una tabla genérica con `EntityType` para permitir a EF Core mantener **Foreign Keys estrictas**, conservar integridad de tipos y permitir eliminaciones en cascada automáticas.
- **Consultas Excluyentes**: Los métodos `ListarContactos`, `BuscarContactos`, `GetDropdownContactos` y sus contrapartes en propiedades inyectan un filtro o `LEFT JOIN` excluyente para ocultar los registros archivados.
- **Defensa en Profundidad**: Bloqueos 403 Forbidden o BadRequest en todos los intentos de mutación de registros archivados (`ActualizarContacto`, `Fusionar`, `Compartir`, etc.).
- **Calculado al Vuelo**: Las respuestas DTO de detalles inyectan un booleano `IsArchivedForCurrentUser` para la UI.
- **Nuevos Controladores**: Endpoints transaccionales `POST /toggle-archive` (ToggleContactArchive y TogglePropertyArchive).

## Diseño de UI/UX (Frontend - React)
- **Navegación (Pills)**: Implementación de un Segmented Control en los listados: "Catálogo Principal" y "Archivados". Permite filtrar y segmentar tipo *Inbox vs Archive*.
- **Zero-Wait Policy**: Actualizaciones optimistas con SWR en los botones "Archivar/Desarchivar". Los registros desaparecen de la vista inmediatamente sin esperar respuesta del servidor.
- **Modo Lectura**: Al visualizar el detalle de un registro archivado (`IsArchivedForCurrentUser` = true):
  - Se ocultan botones de edición, "Fusionar", "Compartir".
  - `TimelineManager` y `FaqManager` esconden el input/textarea y los botones para añadir notas o preguntas.
  - `GalleryManager` bloquea añadir secciones, subir fotos y reordenar.
  - `InterestsManager` oculta añadir intereses.

## Decisiones Técnicas y Reglas
1. Los registros archivados siguen existiendo, pero en modo solo lectura ("Read-Only").
2. El archivado es estrictamente a nivel de agente (un agente lo ve archivado, otro en la misma inmobiliaria lo ve normal).
3. Los menús desplegables (dropdowns) en el sistema excluyen automáticamente a los contactos y propiedades archivados (ej. no se pueden crear tareas para un contacto archivado).
