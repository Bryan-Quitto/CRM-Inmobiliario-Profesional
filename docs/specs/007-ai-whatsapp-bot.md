# Spec: 007-AI-WhatsApp-Bot (Piloto Automático Inmobiliario v2)

## 1. Visión General
El Módulo de Inteligencia Artificial conectado a WhatsApp Business actúa como un "Piloto Automático" para el CRM. Atiende prospectos inmediatamente, los pre-califica, registra nuevos leads autónomamente, y solicita intervención humana cuando el contexto lo supera, dejando un rastro auditable de todas sus acciones.

## 2. Arquitectura de Webhooks (Meta Cloud API)
- **Recepción (`POST /api/webhooks/whatsapp`):** Valida firma, responde `200 OK` rápido y procesa la inferencia en segundo plano.
- **Validación (`GET /api/webhooks/whatsapp`):** Manejo de `hub.challenge` para Meta.

## 3. Base de Datos y Memoria
- **`WhatsappConversations`:** Almacena el historial (JSON) por número para mantener contexto.
- **`AiActionLogs` (NUEVO):** Tabla de auditoría. Campos: `Id`, `TelefonoCliente`, `Accion` (ej: 'Busqueda', 'Registro Lead', 'Alerta'), `DetalleJson`, `Fecha`. Visible desde el frontend con opciones de reversión/eliminación.

## 4. Comportamiento y Prompt (System Message)

El comportamiento base de la IA se definirá mediante un "System Message" estricto que determine su flujo de decisión paso a paso:

> "Eres el asistente virtual inteligente de la agencia 'CRM Inmobiliario Profesional'. Tu tono es profesional, cordial y servicial. Tu objetivo principal es pre-calificar clientes, brindar información precisa del catálogo y agendar visitas.
>
> **Reglas Críticas y Flujo de Decisión:**
> 1. **Identificación:** Si el cliente no está en la base de datos, pregúntale su nombre amablemente y usa `RegistrarNuevoLead`.
> 2. **Búsqueda Básica:** Si el cliente busca propiedades, usa `BuscarPropiedadesDisponibles` (solo campos básicos) para ofrecer opciones.
> 3. **Profundización:** Si el cliente hace una pregunta específica sobre una propiedad que no se resuelve con la información básica, debes usar la función de búsqueda indicando que necesitas leer la `DescripcionDetallada`.
> 4. **Solicitud de Auxilio (ESCALADO INMEDIATO):** Si la respuesta a la pregunta del cliente NO está en la descripción detallada de la propiedad, NO inventes la información. Ejecuta inmediatamente la función `SolicitarAsistenciaHumana` y dile al cliente: *'En unos minutos un agente humano le ayudará con esa información específica.'*
> 5. **Registro de Interés:** Si el cliente confirma que le gusta una propiedad, usa `RegistrarInteresProspecto`."

---

## 5. Function Calling (Herramientas de la IA)

### A. `BuscarPropiedadesDisponibles`
- Parámetros: Presupuesto, tipo, ubicación, y un booleano `incluirDescripcionDetallada` (si el cliente hace preguntas muy específicas).
- Retorno: Datos de la propiedad. 

### B. `RegistrarNuevoLead` (NUEVO)
- **Descripción:** Crea un nuevo cliente en el CRM extrayendo datos de la charla.
- **Parámetros:** `telefono`, `nombreExtraido`, `origen` ('WhatsApp').

### C. `RegistrarInteresProspecto`
- Vincula un Lead existente con una propiedad específica y añade notas de sus preferencias.

### D. `SolicitarAsistenciaHumana` (NUEVO)
- **Descripción:** Se usa cuando la IA no tiene la respuesta o el cliente se frustra.
- **Parámetros:** `telefono`, `motivoResumen`.
- **Acción Backend:** 1. Inserta en `AiActionLogs` con flag de urgencia.
  2. Dispara evento a Supabase Realtime / FCM para enviar notificación Push al navegador/móvil del agente.

  ### E. Módulo Interno: Dictado de Tareas (Agent Tasking)
- **Descripción:** Interfaz dentro del CRM (aplicación web) exclusiva para el agente. Permite presionar un botón de micrófono y dictar el resumen de una llamada o reunión física.
- **Flujo Técnico:**
  1. El frontend en React graba el audio usando la `MediaRecorder API`.
  2. Envía el archivo de audio al backend (.NET).
  3. .NET utiliza la API de `OpenAI Whisper` para transcribir el audio a texto con alta precisión.
  4. .NET pasa la transcripción a `GPT-4o-mini` con la instrucción: *"Extrae la intención y genera un JSON para la AgendaDiaria"*.
  5. La tarea o evento se guarda en la base de datos y se refleja inmediatamente en el calendario del CRM.

## 6. Flujo de Datos
1. Webhook recibe mensaje -> Valida número en DB.
2. Si es nuevo, la IA lo saluda y busca su nombre. Si existe, recupera historial.
3. OpenAI decide si ejecutar funciones (Buscar, Registrar, Alertar) o solo hablar.
4. .NET ejecuta las funciones, guarda en `AiActionLogs` el resultado, y devuelve el contexto a la IA.
5. IA envía respuesta final vía WhatsApp API.