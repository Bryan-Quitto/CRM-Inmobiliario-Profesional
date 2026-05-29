# Prompt para Sesión 4: Lógica Dinámica de Costos en Frontend (Dual-Provider)

**Contexto para la nueva sesión:**
Copia y pega el siguiente texto en una **nueva sesión** de chat para iniciar el ciclo SDD de adaptación del Frontend.

---

**Copia desde aquí:**

Hola Gemini, inicia tu contexto usando `mem_context` para el proyecto "CRM Inmobiliario Profesional" y lee detenidamente `SKILLS.md`. 

Una vez que estés en contexto, quiero que inicies un flujo SDD (Spec-Driven Development) para la siguiente tarea de corrección en el Frontend (React 19 + FSD):

**Objetivo:** Actualizar la lógica de cálculo y visualización de costos por consumo de tokens de IA para que sea inteligente, dinámica y soporte los esquemas de precios de OpenAI (gpt-4o-mini) y Gemini (2.5 Flash), incluyendo los descuentos por Context Caching.

**Contexto Técnico:**
1. Actualmente el Frontend parece estar hardcodeado para calcular los costos basándose en una tarifa fija (probablemente asumiendo OpenAI a $0.15 por millón de tokens).
2. Dado que el backend ahora es Dual-Provider (BYOK), el Frontend debe determinar qué proveedor está usando el Agente/Tenant (ej. verificando si la llave empieza con `AIza` para Gemini, o `sk-` para OpenAI, o leyendo el campo `ActiveLLMProvider` si viene del backend).
3. **Tabla de Precios Confirmada:**
   *   **OpenAI (gpt-4o-mini):**
       *   Input Base: $0.15 / 1M
       *   Input Cacheado (Lectura): $0.075 / 1M (50% ahorro)
       *   Output: $0.60 / 1M
   *   **Gemini (2.5 Flash):**
       *   Input Base: $0.30 / 1M
       *   Input Cacheado (Lectura): $0.03 / 1M (90% ahorro)
       *   Output: $2.50 / 1M
4. **Nota sobre caché:** Dado que el CRM inyecta un super-prompt inmenso, la inmensa mayoría del Input será "Input Cacheado". La UI debe reflejar esta precisión comercial.

**Instrucciones SDD:**
1. Inicia con `/sdd-explore` para buscar en el Frontend (especialmente en la capa FSD como `features/tokens`, `widgets/dashboard`, o utilidades matemáticas) dónde se realiza actualmente la multiplicación matemática de tokens a dólares.
2. Genera una propuesta técnica y diseño (`/sdd-propose` y `/sdd-design`) sobre cómo inyectar estas constantes de precios y cómo la UI mostrará los ahorros por caché al usuario, para que lo perciba como un valor agregado.
3. Detente y pídeme aprobación antes de pasar a la fase de tareas (`/sdd-tasks`). ¡Recuerda respetar los principios de Feature-Sliced Design (FSD) y mantener la UI World-Class!

**Fin del copiado.**
