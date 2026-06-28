# Manual de Reglas de Negocio - Módulo de Inteligencia Artificial (Copilot)

Este documento centraliza las reglas de negocio, validaciones, estados y comportamientos técnicos que rigen el módulo de IA del CRM Inmobiliario. 

## 1. Rol y Contexto General del Copilot
El Copilot opera como un asistente virtual altamente inteligente integrado en el CRM.
- **Propósito:** Asistir a los asesores inmobiliarios en gestión de contactos, creación de tareas, búsqueda de propiedades y consulta de bases de conocimiento.
- **Zona Horaria Estricta:** Todas las operaciones relacionadas con fechas (agendar citas, "hoy", "mañana") se basan rígidamente en la zona horaria de Ecuador (GMT-5).

## 2. Reglas Estrictas de Prompting y Formateo
El motor principal (`AgentSystemPromptFactory`) impone reglas inquebrantables de formateo para asegurar la integración con la interfaz de usuario (UI):

- **Navegación Interna (Routing UI):** Para redirigir al usuario, la IA debe usar enlaces Markdown con el formato `[emoji Texto descriptivo](ruta)`. El frontend (mediante componentes como `CopilotDrawer`) intercepta estos enlaces para navegar sin recargar la página web. 
  - *Rutas válidas:* `/`, `/calendario`, `/contactos`, `/propiedades`, `/kpis`, `/configuracion/perfil`, `/configuracion/ia`, `/ia-logs/whatsapp`.
  - *Rutas dinámicas:* `/contactos/{{id}}` y `/propiedades/{{id}}`.
- **Renderizado de Propiedades:** Al usar la herramienta de búsqueda de propiedades, el resultado debe mostrarse EXACTAMENTE como `[🏠 Ver Ficha Completa: {{Titulo}}](/propiedades/{{Id}})`. El frontend transforma esto en un `PropertyCardPreview`.
- **Base de Conocimiento corporativa:** La información consultada debe sintetizarse en puntos clave o accionables, estando estrictamente prohibido inventar o alucinar políticas.

## 3. Estados y Enrutamiento Semántico (Semantic Router)
El sistema (`SemanticRouterService`) evalúa la intención de cada interacción del usuario para determinar el flujo conversacional. Posibles estados (Intents):
1. **`NUEVA_BUSQUEDA`**: El usuario cambia parámetros clave de búsqueda (ej. ciudad o sector) o inicia una búsqueda desde cero.
2. **`CAMBIO_TEMA`**: El usuario abandona el contexto actual para preguntar algo completamente diferente.
3. **`CONTINUACION`**: (Estado por defecto). El usuario profundiza en la información actual, responde preguntas de la IA o pide detalles de opciones previamente enviadas.

> *Nota técnica:* El enrutador utiliza modelos ligeros y rápidos (`gpt-4o-mini` o `gemini-2.5-flash-lite`) analizando los últimos 3 mensajes sin contar las llamadas a funciones.
> *Nota Aclaratoria UI:* Estos estados son de uso exclusivo interno del backend de IA para evaluar el contexto de conversación y **no son seleccionables ni visibles manualmente por el usuario** en la interfaz del CRM.

## 4. Reglas de Function Calling y Herramientas

### Cotizaciones Rápidas (`GenerarCotizacionRapidaHandler`)
- **Seguridad:** Uso exclusivo restringido al canal "Copilot" interno.
- **Validaciones Anti-Alucinación:**
  - Monto de propiedad mayor a 0.
  - Enganche (Entrada) no puede ser negativo.
  - Tasa de interés anual restringida a valores realistas (entre 1% y 25%).
  - Debe recibir al menos un plazo válido en meses.
  - El monto del préstamo resultante (Propiedad - Enganche) debe ser mayor a 0.
- **Regla Inquebrantable de Información Incompleta:** Si una institución financiera no especifica tasa, plazo o entrada, está **estrictamente prohibido** calcular la cuota. Deben listarse en una sección de "Instituciones que requieren evaluación presencial".
- **Aviso Legal Obligatorio:** La IA está obligada a concatenar exactamente el texto legal indicando que las cotizaciones son "proyecciones referenciales" y no constituyen pre-aprobación crediticia.

### Otras Herramientas Disponibles
El Copilot tiene acceso a otras herramientas de negocio (Actions/Handlers):
- `BuscarPropiedades`, `ConsultarDetallesPropiedad` y `EnviarFotosPropiedad`.
- `ConsultarInteraccionesContacto`, `ResumirHistorialContacto` y `RegistrarInteresContacto`.
- `CrearTareaCRM`.
- `ConsultarBaseConocimiento` y `DerivarCaptacionPropietario`.
- `SolicitarAsistenciaHumana`.

## 5. Control de Concurrencia y Rendimiento
El orquestador de IA (`AgentAiService`) implementa políticas rígidas de ejecución:
- **Bloqueo por Agente:** Se utiliza un semáforo (`SemaphoreSlim`) para garantizar que un mismo usuario (AgentId) no pueda procesar múltiples mensajes en paralelo (1 a la vez).
- **Límite Global del Sistema:** Existe un candado global de concurrencia que permite un máximo estricto de **21 peticiones simultáneas** hacia los proveedores de LLM, para prevenir agotamiento de cuotas y sobrecarga de la API.
