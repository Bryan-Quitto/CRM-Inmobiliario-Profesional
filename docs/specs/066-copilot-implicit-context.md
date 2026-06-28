# Spec: Copilot Implicit Context

## Intención
Mejorar la experiencia de usuario y la precisión del modelo al permitirle a la IA (Copilot) conocer implícitamente qué contacto está visualizando el agente, sin necesidad de que el agente especifique nombres o IDs en sus prompts. 

## Enfoque
1. **Frontend**: Guardar el `focusedContext` (Id y Nombre del contacto) en el store global (`useCopilotStore.ts`). Enviar este objeto en el payload de las peticiones a `/api/AgentAi/stream`. Mostrar un *banner* al usuario informando de que el contexto de este contacto está activo.
2. **Backend**: Recibir `FocusedContextDto` en el endpoint `/stream`. Inyectar un mensaje de `[SISTEMA]` oculto para el LLM, indicándole que el contexto actual es ese UUID y que sus herramientas usarán ese ID.

## Entregables
- [x] Zustand store adaptado (`focusedContext`).
- [x] UI del drawer (Desktop y Mobile) con banner cancelable para quitar contexto.
- [x] Botón `✨ Analizar con IA` en el header del Perfil de Contacto.
- [x] Endpoint Minimal API modificado para aceptar context.
- [x] `AgentAiStreamProcessor` configurado para inyectar prompt oculto al historial.
