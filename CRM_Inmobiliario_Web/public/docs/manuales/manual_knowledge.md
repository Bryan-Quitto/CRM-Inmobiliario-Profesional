# Manual de Base de Conocimiento Institucional

Este documento detalla las reglas de negocio, lógicas de validación y parametrizaciones del grupo de Base de Conocimiento Institucional del CRM Inmobiliario Profesional.

## 1. Gestión de Preguntas Frecuentes (FAQs) por Propiedad
En este sistema no existen las "FAQs globales" o generales del sistema. Las FAQs son **estrictamente por propiedad** y residen exclusivamente dentro del detalle de cada una de ellas. Su función principal es proveer información detallada sobre esa propiedad específica a los Asistentes de IA. El sistema incluye un flujo completo de moderación para estas preguntas y respuestas, permitiendo un ciclo de vida con estados para revisión y aprobación.

### Ciclo de vida y Moderación
- **Creación y Borradores:** Los usuarios pueden crear nuevas FAQs específicas para una propiedad en estado borrador (`CrearFaq`) o eliminarlas si no son necesarias (`EliminarBorrador`).
"Cualquier usuario puede escribir nuevas preguntas frecuentes para una propiedad específica y guardarlas como borrador hasta que estén listas, o borrarlas si ya no sirven."
- **Flujo de Revisión:** Una vez redactada, la FAQ de la propiedad se envía a revisión (`EnviarARevision`) para que el agente que tenga permisos sobre la propiedad evalúe su contenido antes de que la IA pueda usarla.
"Cuando terminas de redactar una pregunta frecuente de una propiedad, debes enviarla para que el agente que tenga permisos sobre la propiedad la revise antes de que el Asistente de IA pueda usarla para responder."
- **Aprobación o Rechazo:** El agente que tenga permisos sobre la propiedad puede aprobar la FAQ para su publicación (`AprobarFaq`) o rechazarla si necesita modificaciones (`RechazarFaq`). Solo las FAQs aprobadas alimentan al asistente de IA.
"El agente que tenga permisos sobre la propiedad revisa las preguntas sugeridas de la propiedad y deciden si las aprueban para que la IA las use inmediatamente o si piden que se cambie algo."
- **Edición y Mantenimiento:** Las FAQs publicadas o rechazadas pueden ser editadas para su corrección o actualización (`EditarFaq`).
"Si una pregunta de una propiedad ya está aprobada o fue devuelta para correcciones, siempre se puede editar para mejorar o actualizar la información que recibe la IA."
- **Activación y Desactivación:** Las FAQs pueden ser desactivadas temporalmente (`DesactivarFaq`) o reactivadas (`ReactivarFaq`) según se necesite, lo que retira o devuelve su acceso al Asistente de IA.
"Si una pregunta frecuente de una propiedad ya no aplica por un tiempo, puedes desactivarla para que la IA no la use, y volver a activarla cuando sea oportuno."

## 2. Ingesta Documental y Conocimiento Corporativo
Además de las FAQs, el CRM soporta la subida de documentos corporativos.
- **Ingesta de Documentos:** Mediante el módulo `CorporateKnowledge / IngestDocument`, los documentos subidos se procesan e indexan (vectorización) para que el asistente de Inteligencia Artificial pueda consultarlos y proveer información precisa a los agentes o clientes.
"Puedes subir documentos con información importante de la empresa. El sistema los leerá y los guardará para que luego el Asistente Inteligente pueda usarlos para responder dudas de forma precisa."
- **Procesamiento Asíncrono:** Los jobs en segundo plano (`Jobs`) se encargan de transformar el texto de estos documentos en vectores que alimentan la base de datos de conocimiento (integrado también en el panel de administración global).
"Al subir un documento, el sistema hace el trabajo pesado de analizarlo por detrás para que puedas seguir usando el sistema sin interrupciones."

## 3. Frontend (UI)
- **FAQs (Por Propiedad):** La interfaz para la gestión de FAQs se encuentra exclusivamente integrada dentro del módulo de propiedades (`src/features/propiedades/components/propiedad-detalle-sections`), permitiendo a los agentes interactuar con ellas directamente desde el detalle de cada propiedad para alimentar y gestionar el conocimiento de los Asistentes de IA.
"Puedes crear y gestionar las preguntas frecuentes específicas de cada inmueble directamente mientras ves sus detalles, alimentando así a la Inteligencia Artificial. ¡Todo está a la mano!"
- **Base de Conocimiento Corporativa:** La interfaz para la ingesta de documentos (.md) se ubica en el panel de Configuración de IA (`src/features/configuracion/components/BaseConocimientoSection.tsx`), donde se puede definir el alcance de la documentación (uso interno o público) y si es global o para una agencia específica.
"Desde el panel de configuración del administrador, se puede subir archivos de texto y decidir si esa información será solo para uso interno del equipo, para el público general, o para ciertas agencias."