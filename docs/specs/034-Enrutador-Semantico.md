# Spec 034: Enrutador Semántico y Aislamiento de Herramientas (Context Bleed)

## Intent
Solucionar el problema de "Context Bleed" (contaminación de contexto) donde el asistente de IA confunde restricciones como el presupuesto o número de habitaciones de búsquedas anteriores en la misma conversación. Se mejorará el enrutamiento lógico introduciendo un evaluador dinámico (Semantic Router) y aislando los parámetros en los esquemas de las herramientas.

Esta implementación es 100% Agnóstica. El Evaluador Semántico funcionará independientemente de si el inquilino (tenant) utiliza una clave (BYOK) de OpenAI o de AI Studio (Gemini).

## Arquitectura y Decisiones (Aprobado)

### 1. Schemas & Tools
- Actualizar la descripción de la herramienta `BuscarPropiedades`.
- Modificar las descripciones de los parámetros (`presupuestoMaximo`, `habitaciones`, `tipoOperacion`) insertando instrucciones estrictas que exijan al modelo extraer el valor **ÚNICA Y EXCLUSIVAMENTE** basándose en la última interacción del usuario.
- Reforzar que el parámetro principal (`query` o análogo) sea de naturaleza estrictamente semántica y de búsqueda libre, evitando que se sobreescriba con filtros duros anteriores.
- **Desacoplamiento de Estado:** Limpiar los parámetros de búsqueda activos cuando se detecte un cambio de tema, independientemente de que se mantenga el historial conversacional.

### 2. Core LLM Services & Semantic Router
- Inyectar el paso de **Enrutador Semántico** previo a la invocación de `StreamChatAsync` en la infraestructura conversacional.
- **Configuración Optimizada de Latencia:** Instanciar dinámicamente un cliente LLM (`gemini-2.5-flash` o `gpt-4o-mini`) con `MaxTokens = 10` y utilizar Structured Outputs o un Enum estricto para forzar únicamente la clasificación (`NUEVA_BUSQUEDA`, `CAMBIO_TEMA`, `CONTINUACION`).
- **Prompt Estricto Binario:** El clasificador tendrá una regla binaria estricta: devolver `CONTINUACION` si añade/refina filtros, o `NUEVA_BUSQUEDA` si cambia el inmueble/ubicación o descarta lo anterior.
- **Ventana Deslizante (Sliding Window):** Evitar el "Hard Reset" (amnesia). Cuando haya un cambio de tema, limpiar **únicamente** el estado de filtros de herramientas, pero mantener los últimos 4-6 mensajes en el contexto conversacional para retener la coherencia del hilo.

## Tasks & Implementación
**Fase 1: Semantic Router Foundation**
- Implementar la lógica del Evaluador (Prompt Enum `gemini-2.5-flash` / `gpt-4o-mini`, MaxTokens=10).
- Actualizar `AiToolDefinitions.cs`.

**Fase 2: Decoupled State & Sliding Window**
- Modificar `WhatsAppConversationManager.cs` para limpiar filtros en `NUEVA_BUSQUEDA`.
- Implementar retención de 4-6 mensajes (Sliding Window) para la memoria conversacional.

**Fase 3: Integration & Testing**
- Integrar la llamada al Enrutador Semántico en el flujo principal (`WhatsAppAiService.cs`).
- Validaciones y tests unitarios.
