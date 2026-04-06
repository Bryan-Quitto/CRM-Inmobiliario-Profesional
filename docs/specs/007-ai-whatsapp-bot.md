# Spec: 007-AI-WhatsApp-Bot (Piloto Automático Inmobiliario)

## 1. Visión General
El Módulo de Inteligencia Artificial conectado a WhatsApp Business actúa como un "Piloto Automático" para el CRM. Su objetivo es atender prospectos de forma inmediata, pre-calificarlos según sus necesidades y presupuesto, y realizar acciones autónomas en el sistema (como buscar propiedades o registrar intereses) mediante el uso de **Function Calling**.

**Objetivo:** Reducir el tiempo de respuesta a 0 segundos y asegurar que cada lead sea atendido y categorizado antes de la intervención humana.

---

## 2. Arquitectura de Webhooks (Meta Cloud API)

Para recibir mensajes en tiempo real, se implementará un endpoint de Webhook compatible con los requisitos de seguridad de Meta.

### A. Endpoint de Recepción
- **Ruta:** `POST /api/webhooks/whatsapp`
- **Seguridad:** Validación de `X-Hub-Signature-256` para asegurar que el mensaje proviene de Meta.
- **Procesamiento:** El webhook debe responder con `200 OK` inmediatamente para evitar reintentos de Meta, delegando el procesamiento pesado (IA) a un proceso en segundo plano (Background Service / Task).

### B. Validación de Token (Hub Challenge)
- **Ruta:** `GET /api/webhooks/whatsapp`
- **Lógica:** Implementar la verificación del `hub.mode`, `hub.verify_token` y retornar el `hub.challenge` tal como lo requiere el panel de desarrolladores de Meta.

---

## 3. Elección del LLM y Gestión de Contexto

### A. Proveedor de IA
- **LLM Recomendado:** OpenAI GPT-4o o GPT-4o-mini (por su alta eficiencia en Function Calling y bajo costo).
- **SDK:** `OpenAI .NET SDK` (Oficial de Microsoft/OpenAI) o `Semantic Kernel` para orquestación avanzada.

### B. Memoria de Conversación (Persistence)
Para que la IA mantenga el hilo de la charla, no podemos depender del estado en memoria del servidor.
- **Estructura:** Tabla `WhatsappConversations`.
- **Campos:** `TelefonoCliente` (PK), `ContextoJson` (Historial de los últimos 10-15 mensajes), `UltimaActualizacion`.
- **Lógica:** Antes de llamar al LLM, se recupera el historial de esta tabla. Tras la respuesta de la IA, se actualiza el JSON con el nuevo intercambio.

---

## 4. Prompt del Sistema (System Message)

El comportamiento base de la IA se definirá mediante un "System Message" robusto:

> "Eres el asistente virtual inteligente de la agencia 'CRM Inmobiliario Profesional'. Tu tono es profesional, cordial y servicial. Tu objetivo principal es ayudar a los clientes a encontrar su propiedad ideal y agendar visitas. 
> 
> **Reglas Críticas:**
> 1. Si el cliente pregunta por propiedades, usa la función `BuscarPropiedadesDisponibles`.
> 2. Si el cliente muestra interés claro en una propiedad específica o deja sus datos, usa `RegistrarInteresProspecto`.
> 3. No inventes propiedades que no estén en el catálogo.
> 4. Si no puedes ayudar en algo específico, indica que un agente humano lo contactará pronto."

---

## 5. Function Calling (Herramientas de la IA)

La IA tendrá acceso a herramientas para interactuar con la base de datos del CRM.

### A. `BuscarPropiedadesDisponibles`
- **Descripción:** Consulta el catálogo activo del CRM.
- **Parámetros (JSON Schema):**
  - `presupuestoMax`: (number) Presupuesto máximo del cliente.
  - `tipoPropiedad`: (string) 'Casa', 'Departamento', 'Terreno', etc.
  - `ubicacion`: (string) Sector o ciudad de interés.
- **Retorno:** Lista de hasta 3 propiedades que coincidan (Título, Precio, Enlace a Ficha).

### B. `RegistrarInteresProspecto`
- **Descripción:** Actualiza el CRM con el interés del lead.
- **Parámetros (JSON Schema):**
  - `telefono`: (string) Teléfono del cliente (ID único).
  - `propiedadId`: (guid) ID de la propiedad que le interesó.
  - `notas`: (string) Resumen de lo que busca el cliente.
- **Acción en Backend:** Busca o crea el `Lead`, vincula el `LeadPropertyInterest` y marca la etapa como "Contactado".

---

## 6. Flujo de Datos (Inbound & Outbound)

1. **Entrada:** Meta envía JSON al Webhook -> .NET valida firma.
2. **Contexto:** .NET recupera `WhatsappConversations` de la DB para ese número de teléfono.
3. **Inferencia:** .NET envía historial + mensaje nuevo + System Prompt + Tools a OpenAI.
4. **Acción (Opcional):** Si OpenAI solicita una función, .NET ejecuta el Feature correspondiente (ej: `ListarPropiedades`), obtiene el resultado y lo devuelve a OpenAI.
5. **Salida:** OpenAI genera la respuesta final en texto -> .NET construye el JSON para `POST https://graph.facebook.com/v17.0/{PHONE_NUMBER_ID}/messages` -> Cliente recibe el mensaje en WhatsApp.

---

## 7. Próximos Pasos (Tareas Técnicas)

1. **Infraestructura:** Crear la tabla `WhatsappConversations` en Supabase/EF Core.
2. **Webhook Base:** Implementar el endpoint de verificación y recepción (Minimal API).
3. **Integración Meta:** Configurar `HttpClient` con el Token de Acceso Permanente de Meta.
4. **Capa IA:** Implementar el servicio `WhatsappAiOrchestrator` que maneje las llamadas a OpenAI y el manejo de funciones.
5. **Seguridad:** Configurar las variables de entorno para `OPENAI_API_KEY` y `WHATSAPP_VERIFY_TOKEN`.