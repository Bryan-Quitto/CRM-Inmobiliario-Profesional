# Spec 020: Detección Proactiva de Fricción (Sentiment Analysis)

## 1. Contexto y Problema
En ocasiones, los clientes pueden frustrarse porque el bot no entiende exactamente lo que quieren, o simplemente prefieren hablar con una persona real. Actualmente, el bot trata de seguir siendo servicial y continúa respondiendo, lo cual empeora la experiencia (ej. el cliente dice *"NO QUIERO MÁS CASAS, AYUDA"* y el bot sigue sugiriendo propiedades). Un CRM World-Class detecta esta fricción inmediatamente y escala el caso de forma silenciosa y elegante.

## 2. Objetivo
Utilizar la capacidad de razonamiento nativa de **GPT-4o-mini** para realizar *Sentiment Analysis* en tiempo real, identificando frustración, enojo, quejas o solicitudes explícitas de asistencia humana. Si se detecta este estado, el bot debe detener el flujo de venta y escalar proactivamente al equipo humano.

## 3. Arquitectura Propuesta: Prompt Engineering + Intervención de Estado
Dado que procesar cada mensaje por una API externa de NLP agregaría latencia y costos innecesarios, la mejor estrategia es aprovechar el LLM orquestador existente.

### 3.1. Refactor de SystemPromptFactory
Añadir una directiva de máxima prioridad ("REGLA DE ESCALAMIENTO PROACTIVO - SENTIMENT ANALYSIS"):
- El modelo evaluará la intención y sentimiento del último mensaje del usuario.
- Si detecta: frustración, sarcasmo negativo, quejas repetitivas, lenguaje ofensivo, o la petición explícita de hablar con un humano ("asesor", "persona", "llama").
- El modelo **DEBE** invocar la herramienta `SolicitarAsistenciaHumana` de forma obligatoria.
- La respuesta en texto (después de usar la herramienta) debe ser empática: *"Lamento no haberte podido ayudar como esperabas. En este momento estoy transfiriendo tu caso a uno de nuestros agentes humanos para que te atienda personalmente."*

### 3.2. Refactor de SolicitarAsistenciaHumanaHandler
Cuando la IA decida invocar esta herramienta, se debe:
- Modificar el registro del `Contacto` en la base de datos (por ejemplo, cambiar un flag `RequiereAsistenciaHumana = true` o moverlo a una Etapa específica como "Asignado").
- Guardar el motivo del enojo/frustración reportado por el bot para que el agente humano tenga contexto.

### 3.3. Bloqueo de IA (Silence Mode)
- Modificar el gestor de conversación (`WhatsAppConversationManager.cs`) para que, durante el paso de preparar el contexto (`PrepareContextAsync`), si el cliente está marcado como "Escalado/Requiere Humano", se retorne un `AutoResponse` vacío o una señal que instruya al `WhatsAppAiService` a **no responder nada más**.
- De esta manera, el bot se calla y deja que el humano tome el control en WhatsApp.

---

## 4. Requerimientos Técnicos (Checklist de Implementación)

### Fase 1: Prompt Engineering
- [ ] Editar `SystemPromptFactory.cs` para incluir las reglas claras de Sentiment Analysis.
- [ ] Revisar `AiToolDefinitions.cs` y asegurar que la descripción de `SolicitarAsistenciaHumana` instruya al modelo a usarla ante frustración del usuario.

### Fase 2: Lógica de Hand-off (Escalamiento)
- [ ] Modificar la entidad `Contacto` (si es necesario) o usar un campo existente como `EtapaEmbudo = "Escalado"` en el `SolicitarAsistenciaHumanaHandler.cs`.
- [ ] Modificar `WhatsAppConversationManager.cs` para detectar si el contacto está escalado y prevenir que el bot siga respondiendo (Silence Mode).

---

## 5. Criterios de Aceptación
1. **Fricción detectada:** Si el usuario escribe *"eres un robot inútil, pásame con alguien"*, el bot llama a la herramienta, se despide amablemente y no vuelve a responder.
2. **Silence Mode:** Cualquier mensaje posterior enviado por el usuario es guardado en la base de datos pero el bot **ignora** responder automáticamente.
3. **Visibilidad del Asesor:** El estado del contacto se actualiza en la DB, lo cual alerta a los asesores que un humano debe intervenir de urgencia.
