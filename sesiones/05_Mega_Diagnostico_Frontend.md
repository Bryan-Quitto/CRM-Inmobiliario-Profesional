# Prompt para Sesión 5: Mega Diagnóstico Frontend y Paridad Dual-Provider

**Contexto para la nueva sesión:**
Copia y pega el siguiente texto en una **nueva sesión** de chat para iniciar la auditoría final y exhaustiva del Frontend.

---

**Copia desde aquí:**

Hola Gemini, inicia tu contexto usando `mem_context` para el proyecto "CRM Inmobiliario Profesional" y lee detenidamente `SKILLS.md`. 

Una vez que estés en contexto, quiero que inicies un flujo SDD (Spec-Driven Development) pero en modo **Auditoría Global de Frontend** (React 19 + FSD). 

**Objetivo:** Tras migrar masivamente el Backend a una arquitectura Dual-Provider (Gemini + OpenAI), debemos barrer de punta a punta todo el Frontend para purgar dependencias hardcodeadas, naming erróneo, validaciones obsoletas y cualquier inconsistencia visual que asuma que OpenAI es el único motor.

**Lista de Verificación / Tareas a Explorar:**
1. **Validaciones de Input (API Keys):** Revisa todos los formularios (ej. `ConfiguracionIntegracionIA`, `Onboarding`, etc.) donde el usuario pegue su llave BYOK. ¿Hay validaciones Regex que exijan que la llave empiece por `sk-`? Hay que permitir también las de Google (`AIza...`).
2. **Naming y Branding (Textos):** Busca en el código referencias quemadas como "Conectar ChatGPT", "OpenAI Config", "Respuestas por GPT", etc. Cambia estos textos a un lenguaje neutro y profesional como "Configuración IA", "Proveedor LLM", o "Motor de Inteligencia Artificial".
3. **Flujos de Error/Notificaciones:** Asegúrate de que los mensajes de error no digan "Error conectando a OpenAI" si el error proviene de una desconexión general.
4. **Chat Inmobiliario (Historial Visual):** Revisa el componente de chat interno. Ahora que soportamos audios procesados nativamente por Gemini (sin Whisper en ese provider), asegúrate de que el frontend renderice correctamente los indicadores de mensajes de voz y las transcripciones sin romperse si la estructura cambió levemente o si ya no hay menciones explícitas a Whisper.

**Instrucciones SDD:**
1. Inicia con `/sdd-explore` usando herramientas como `grep_search` masivo (ej. busca `OpenAI`, `sk-`, `ChatGPT` dentro del directorio `src` del frontend).
2. Documenta todos los hallazgos.
3. Genera la propuesta técnica y diseño (`/sdd-propose` y `/sdd-design`) con la lista de componentes a limpiar.
4. Detente y pídeme aprobación antes de pasar a la fase de tareas (`/sdd-tasks`). ¡El objetivo es dejar un SaaS 100% pulido, agnóstico y premium!

**Fin del copiado.**
