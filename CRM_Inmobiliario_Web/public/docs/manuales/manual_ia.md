# Manual de Reglas de Negocio - Módulo de Inteligencia Artificial (Copilot)

Este documento centraliza las reglas de negocio, validaciones, estados y comportamientos técnicos que rigen el módulo de IA del CRM Inmobiliario. 

## 1. Rol y Contexto General del Copilot
El Copilot opera como un asistente virtual altamente inteligente integrado en el CRM.
- **Propósito:** Asistir a los asesores inmobiliarios en gestión de contactos, creación de tareas, búsqueda de propiedades y consulta de bases de conocimiento.
"Tu Asistente Virtual está aquí para ayudarte en tu día a día: desde organizar tus contactos y tareas, hasta buscar propiedades y responder tus dudas sobre el negocio."
- **Zona Horaria Estricta:** Todas las operaciones relacionadas con fechas (agendar citas, "hoy", "mañana") se basan rígidamente en la zona horaria de Ecuador (GMT-5).
"Todas las fechas y horas (como cuando dices 'agendar para mañana') se manejan siempre en el horario de Ecuador"

## 2. Reglas Estrictas de Prompting y Formateo
El motor principal (`AgentSystemPromptFactory`) impone reglas inquebrantables de formateo para asegurar la integración con la interfaz de usuario (UI):

- **Navegación Interna (Routing UI):** Para redirigir al usuario, la IA debe usar enlaces Markdown con el formato `[emoji Texto descriptivo](ruta)`. El frontend (mediante componentes como `CopilotDrawer`) intercepta estos enlaces para navegar sin recargar la página web. 
  - *Rutas válidas:* `/`, `/calendario`, `/contactos`, `/propiedades`, `/kpis`, `/configuracion/perfil`, `/configuracion/ia`, `/ia-logs/whatsapp`.
  - *Rutas dinámicas:* `/contactos/{{id}}` y `/propiedades/{{id}}`.
"El asistente te compartirá enlaces rápidos con emojis para llevarte directo a otras pantallas del sistema (como tu calendario o tus contactos) sin que tengas que salir de la página."
- **Renderizado de Propiedades:** Al usar la herramienta de búsqueda de propiedades, el resultado debe mostrarse EXACTAMENTE como `[🏠 Ver Ficha Completa: {{Titulo}}](/propiedades/{{Id}})`. El frontend transforma esto en un `PropertyCardPreview`.
"Cuando le pidas buscar propiedades, el asistente te mostrará tarjetas interactivas y visuales listas para que veas todos los detalles."
- **Base de Conocimiento corporativa:** La información consultada debe sintetizarse en puntos clave o accionables, estando estrictamente prohibido inventar o alucinar políticas.
"El asistente buscará en los documentos de la plataforma y te dará respuestas resumidas y reales. Si no sabe algo, no se lo inventará."

## 3. Estados y Enrutamiento Semántico (Semantic Router)
El sistema (`SemanticRouterService`) evalúa la intención de cada interacción del usuario para determinar el flujo conversacional. Posibles estados (Intents):
1. **`NUEVA_BUSQUEDA`**: El usuario cambia parámetros clave de búsqueda (ej. ciudad o sector) o inicia una búsqueda desde cero.
"Si cambias de idea y le pides buscar en otra ciudad, el asistente sabrá que estás empezando una búsqueda nueva."
2. **`CAMBIO_TEMA`**: El usuario abandona el contexto actual para preguntar algo completamente diferente.
"Puedes cambiar de tema en cualquier momento; el asistente se adaptará rápidamente a tu nueva consulta."
3. **`CONTINUACION`**: (Estado por defecto). El usuario profundiza en la información actual, responde preguntas de la IA o pide detalles de opciones previamente enviadas.
"El asistente recordará de qué están hablando. Si le pides 'más detalles de esa casa', sabrá exactamente a cuál te refieres."

> *Nota técnica:* El enrutador utiliza modelos ligeros y rápidos (`gpt-4o-mini` o `gemini-2.5-flash-lite`) analizando los últimos 3 mensajes sin contar las llamadas a funciones.
"Tu asistente analiza tus últimos mensajes para entender el hilo de la conversación de forma rápida y fluida."
> *Nota Aclaratoria UI:* Estos estados son de uso exclusivo interno del backend de IA para evaluar el contexto de conversación y **no son seleccionables ni visibles manualmente por el usuario** en la interfaz del CRM.
"No tienes que preocuparte por configurar nada de esto; el asistente sabe identificar por su cuenta cómo guiar la charla."

## 4. Reglas de Function Calling y Herramientas por IA

La plataforma cuenta con 3 IAs distintas, cada una con acceso a herramientas específicas según su canal de operación:

### 4.1. IA Personal del Agente (Copilot)
Esta IA asiste directamente al agente dentro del CRM. Tiene acceso exclusivo a funciones de administración y a herramientas compartidas.

- **BuscarPropiedades:** Busca inmuebles utilizando búsqueda semántica según las especificaciones del cliente.
"Puedes pedirle al asistente que busque propiedades basándose en lo que tu cliente necesita."

- **ConsultarDetallesPropiedad:** Consulta detalles profundos de una propiedad específica.
"Pídele al asistente que te muestre todos los detalles e información profunda de cualquier propiedad."

- **ConsultarBaseConocimiento:** Consulta documentos y políticas corporativas tanto públicas como internas.
"Consúltale sobre políticas de la empresa, manuales o procesos internos y te dará la respuesta exacta."

- **ResumirHistorialContacto:** Consulta el historial completo (notas, tareas, mensajes) del contacto actual en la UI.
"Pídele que te resuma de qué has hablado y qué ha pasado con tu cliente hasta ahora."

- **ConsultarInteraccionesContacto:** Lee el registro de interacciones (llamadas, reuniones, correos, notas) del contacto actual en la UI.
"Revisa de forma rápida todas las llamadas, correos o reuniones que has tenido con un contacto."

- **CrearTareaCRM:** Crea un recordatorio o visita en la agenda del agente.
"Dile 'recuérdame llamar a Juan mañana', y el asistente creará la tarea en tu calendario por ti."

- **GenerarCotizacionRapida:** Calcula la proyección hipotecaria y cuotas estimadas basándose en documentos corporativos internos.
"Solo tú, desde dentro del sistema, puedes usar el asistente para generar estas cotizaciones rápidas."
  - *Validaciones Anti-Alucinación:* Monto mayor a 0, enganche no negativo, tasa anual entre 1% y 25%, al menos un plazo en meses, préstamo mayor a 0.
  "El asistente verificará que todos los números de tu cotización tengan sentido (precio válido, cuota inicial real, etc.) para evitar fallos al momento del calculo, las validaciones son:
    - Monto de propiedad mayor a 0.
    - Enganche (Entrada) no puede ser negativo.
    - Tasa de interés anual restringida a valores realistas (entre 1% y 25%).
    - Debe recibir al menos un plazo válido en meses.
    - El monto del préstamo resultante (Propiedad - Enganche) debe ser mayor a 0."
  - *Regla Inquebrantable de Información Incompleta:* Si falta tasa, plazo o entrada, no se calcula la cuota y se sugiere evaluación presencial.
  "Si el banco no nos da todos los datos, el asistente no adivinará la cuota mensual. En su lugar, te avisará que ese banco requiere que se acerque en persona."
  - *Aviso Legal Obligatorio:* Añadir texto indicando que son proyecciones referenciales.
  "En cada cotización, el asistente agregará un pequeño aviso legal para recordarle que es solo un cálculo de referencia, no una aprobación final del banco."

### 4.2. IA de WhatsApp
Esta IA atiende a los clientes directamente a través de WhatsApp. Tiene acceso a herramientas compartidas y a herramientas exclusivas para el trato con el cliente final.

- **BuscarPropiedades:** Busca inmuebles utilizando búsqueda semántica según las especificaciones del cliente.
"El asistente buscará la casa ideal para ti usando las características que nos menciones en el chat de WhatsApp."

- **ConsultarDetallesPropiedad:** Consulta detalles profundos de una propiedad específica.
"El asistente te puede contar todo sobre esa propiedad que te interesó."

- **ConsultarBaseConocimiento:** Consulta únicamente documentos y políticas corporativas públicas.
"El asistente responderá tus dudas frecuentes consultando nuestra información oficial para clientes."

- **RegistrarInteresContacto:** Registra formalmente el nivel de interés de un contacto por una propiedad específica (Alto, Medio, Bajo, Descartada).
"El asistente tomará nota de qué propiedades te gustaron más para enviarte mejores opciones en el futuro."

- **SolicitarAsistenciaHumana:** Apaga el bot y escala la conversación a un agente humano en caso de frustración o petición expresa.
"Si el asistente no puede ayudarte o prefieres hablar con una persona, te conectará rápidamente con uno de nuestros asesores."

- **DerivarCaptacionPropietario:** Registra al usuario como "Propietario", apaga el bot y lo deriva al equipo de captación si quiere vender o alquilar.
"Si deseas vender o alquilar tu casa con nosotros, el asistente tomará tus datos y te contactará con nuestro equipo especializado."

- **EnviarFotosSeccionPropiedad:** Envía al cliente la galería de fotos de una sección específica de una propiedad utilizando paginación.
"El asistente te enviará las fotos de la cocina, sala o cualquier otra parte de la casa que quieras ver directo a tu WhatsApp."

### 4.3. IA de Facebook
Esta IA atiende a los clientes a través de Facebook Messenger o comentarios. Sus herramientas son idénticas a las de WhatsApp, pero contextualizadas a la plataforma.

- **BuscarPropiedades:** Busca inmuebles utilizando búsqueda semántica según las especificaciones del cliente.
"El asistente buscará la casa ideal para ti usando las características que nos menciones por Facebook."

- **ConsultarDetallesPropiedad:** Consulta detalles profundos de una propiedad específica.
"El asistente te dará más detalles de la propiedad directamente en el chat de Facebook."

- **ConsultarBaseConocimiento:** Consulta únicamente documentos y políticas corporativas públicas.
"El asistente resolverá tus dudas habituales al instante consultando nuestra base de información pública."

- **RegistrarInteresContacto:** Registra formalmente el nivel de interés de un contacto por una propiedad específica.
"El asistente recordará tus preferencias para mostrarte propiedades que realmente te interesen."

- **SolicitarAsistenciaHumana:** Apaga el bot y escala la conversación a un agente humano.
"Si la duda es muy compleja, el asistente le avisará a un asesor humano para que continúe la charla contigo."

- **DerivarCaptacionPropietario:** Registra al usuario como "Propietario" y lo deriva al equipo de captación.
"Si lo que buscas es vender tu casa, el asistente se encargará de avisarle a nuestro equipo para que se ponga en contacto."

- **EnviarFotosSeccionPropiedad:** Envía al cliente la galería de fotos de una sección específica de una propiedad.
"Podrás pedirle al asistente que te envíe más fotos de ciertas áreas de la casa, y te las compartirá de inmediato."

## 5. Control de Concurrencia y Rendimiento
El orquestador de IA (`AgentAiService`) implementa políticas rígidas de ejecución:
- **Bloqueo por Agente:** Se utiliza un semáforo (`SemaphoreSlim`) para garantizar que un mismo usuario (AgentId) no pueda procesar múltiples mensajes en paralelo (1 a la vez).
"Para asegurarse de no confundirse, el asistente responderá tus mensajes uno por uno. Solo debes esperar a que termine antes de enviarle otra solicitud."
- **Límite Global del Sistema:** Existe un candado global de concurrencia que permite un máximo estricto de **21 peticiones simultáneas** hacia los proveedores de LLM, para prevenir agotamiento de cuotas y sobrecarga de la API.
"El sistema está protegido para que, incluso si todos los agentes usan el asistente al mismo tiempo, el servicio siga siendo estable y rápido."
