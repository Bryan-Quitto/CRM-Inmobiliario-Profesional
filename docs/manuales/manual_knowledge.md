# Manual de Base de Conocimiento Institucional

Este documento detalla las reglas de negocio, lógicas de validación y parametrizaciones del grupo de Base de Conocimiento Institucional del CRM Inmobiliario Profesional.

## 1. Gestión de Preguntas Frecuentes (FAQs)
El sistema incluye un flujo completo de moderación para la base de conocimiento en formato de preguntas y respuestas (FAQs), que permite un ciclo de vida con estados para revisión y aprobación.

### Ciclo de vida y Moderación
- **Creación y Borradores:** Los usuarios pueden crear nuevas FAQs en estado borrador (`CrearFaq`) o eliminarlas si no son necesarias (`EliminarBorrador`).
- **Flujo de Revisión:** Una vez redactada, la FAQ se envía a revisión (`EnviarARevision`) para que un administrador evalúe su contenido.
- **Aprobación o Rechazo:** Los administradores pueden aprobar la FAQ para su publicación (`AprobarFaq`) o rechazarla si necesita modificaciones (`RechazarFaq`).
- **Edición y Mantenimiento:** Las FAQs publicadas o rechazadas pueden ser editadas para su corrección o actualización (`EditarFaq`).
- **Activación y Desactivación:** Las FAQs pueden ser ocultadas temporalmente (`DesactivarFaq`) o reactivadas (`ReactivarFaq`) según se necesite.

## 2. Ingesta Documental y Conocimiento Corporativo
Además de las FAQs, el CRM soporta la subida de documentos corporativos.
- **Ingesta de Documentos:** Mediante el módulo `CorporateKnowledge / IngestDocument`, los documentos subidos se procesan e indexan (vectorización) para que el asistente de Inteligencia Artificial pueda consultarlos y proveer información precisa a los agentes o clientes.
- **Procesamiento Asíncrono:** Los jobs en segundo plano (`Jobs`) se encargan de transformar el texto de estos documentos en vectores que alimentan la base de datos de conocimiento (integrado también en el panel de administración global).

## 3. Frontend (UI)
- **FAQs:** La interfaz para la gestión de FAQs se encuentra integrada dentro del módulo de propiedades (`src/features/propiedades/components/propiedad-detalle-sections`), permitiendo a los agentes interactuar con ellas directamente desde el detalle de cada propiedad (incluyendo creación, edición y revisión).
- **Base de Conocimiento Corporativa:** La interfaz para la ingesta de documentos (.md) se ubica en el panel de Configuración de IA (`src/features/configuracion/components/BaseConocimientoSection.tsx`), donde se puede definir el alcance de la documentación (uso interno o público) y si es global o para una agencia específica.
