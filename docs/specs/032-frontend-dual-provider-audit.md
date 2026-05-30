# Spec 032: Auditoría Global de Frontend (Dual-Provider & Multimodalidad)

## 1. Objetivo
Tras la migración del Backend a una arquitectura Dual-Provider (Gemini + OpenAI), el Frontend requería una purga masiva de dependencias hardcodeadas, naming obsoleto y validaciones que asumían que OpenAI era el único motor. Además, se requería actualizar el componente de chat para renderizar audios nativamente, aprovechando las capacidades multimodales de Gemini 1.5.

## 2. Alcance y Componentes Modificados

### 2.1. Agnosticismo del Proveedor LLM
- **Archivos Modificados:** 
  - `src/features/configuracion/components/ConfiguracionIA.tsx`
  - `src/features/configuracion/components/ConfiguracionIntegracionIA.tsx`
- **Cambios Aplicados:**
  - Se eliminaron las validaciones estrictas (Regex) que exigían que las API Keys comenzaran con `sk-`.
  - Se permite el uso de llaves de Google Gemini (`AIza...`).
  - Los textos como "Conectar ChatGPT" y "OpenAI Config" fueron reemplazados por nomenclatura agnóstica y profesional (ej. "Configuración del Proveedor LLM", "Tu API Key").

### 2.2. Configuración por Defecto del Modelo
- **Archivo Modificado:** 
  - `src/hooks/useConversacionIA.ts`
- **Cambios Aplicados:**
  - Se eliminó el string hardcodeado `openai-gpt4o` o `gpt-4o`.
  - El modelo por defecto ahora se inyecta vía variables de entorno (`import.meta.env.VITE_DEFAULT_AI_MODEL`), con un *fallback* seguro a `gemini-1.5-flash`.

### 2.3. Soporte Multimodal Nativo (Chat Inmobiliario)
- **Archivos Modificados:** 
  - `src/types/auditoria.ts`
  - `src/features/auditoria/components/AuditoriaSectionConversacion.tsx`
- **Cambios Aplicados:**
  - Se extendió la interfaz `MensajeChat` inyectando los campos opcionales `tipo?: 'texto' | 'audio'` y `audioUrl?: string`.
  - Se implementó un renderizado condicional en la interfaz del chat. Si el mensaje es de voz, se dibuja un elemento `<audio controls>` nativo de HTML5 para permitir la reproducción directa, integrándose con el procesamiento multimodal de Gemini sin depender de Whisper.

## 3. Optimizaciones Adicionales y Bugfixes
- Corrección de errores tipográficos en clases de Tailwind (se reemplazó `contactoing-relaxed` por `leading-relaxed`).
- Saneamiento de importaciones TypeScript (`type AIModel`).
- Resolución de conflictos en referencias de tipos en la suite de *Vitest*, resultando en 0 errores y warnings durante `tsc -b` y `eslint`.

## 4. Criterios de Aceptación Verificados
- [x] El Frontend compila sin errores (0 *TypeScript Errors* y 0 *ESLint Warnings*).
- [x] Un usuario puede ingresar y guardar una API Key de Google (`AIza...`) sin ser bloqueado por la UI.
- [x] El componente de chat no falla al recibir un objeto `MensajeChat` que contenga formato de audio y lo renderiza exitosamente con un reproductor interactivo.
- [x] Toda la terminología UI/UX es 100% agnóstica al proveedor (BYOK Genérico).
