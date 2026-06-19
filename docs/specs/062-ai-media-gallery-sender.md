# 062 - Envío Inteligente de Galerías IA y Auditoría Multimedia

## Descripción General
Esta especificación detalla la implementación del módulo de envío de fotografías de propiedades integrado a las Inteligencias Artificiales del CRM (WhatsApp y Facebook Messenger). Además, contempla la intercepción y registro de mensajes multimedia para auditoría sin almacenamiento de blobs en la base de datos.

## 1. Reglas de Negocio
- La IA **no** lee ni envía fotos de la "Galería General". Solo opera con fotos que pertenecen a **Secciones** de una propiedad (`PropertyGallerySections`).
- La IA tiene un **límite duro de 7 fotos** por envío para evitar saturación de la API o "spamming" al cliente. Si la sección tiene más fotos, la IA utilizará paginación (`offset`) para enviar el resto progresivamente bajo demanda del contacto.
- La IA no procesa ni analiza píxeles de imágenes, el backend gestiona el despacho directo de las URLs (`.webp`) generadas por el Frontend al guardarlas.

## 2. Arquitectura de Despacho (SSoT)
Se implementó el patrón *Single Source of Truth* mediante `PropertyGalleryAiDispatcher`. Este componente es agnóstico al canal y orquesta la lógica base:
1. **Validación**: Busca la propiedad y sus fotos filtrando por `SectionId != null`.
2. **Paginación**: Aplica la lógica `.Skip(offset).Take(7)`.
3. **Flujo de Decisión**:
   - Si `enviarTodas = false`: Retorna a la IA los pies de foto o un resumen para que la IA decida cuáles mandar después.
   - Si `enviarTodas = true`: Delega el envío iterativo de imágenes al Sender inyectado (`IWhatsAppMessageSender` o `IFacebookMessageSender`) según corresponda al contexto.

## 3. Integración de Canales
- **WhatsApp**: El `WhatsAppMessageSender` fue extendido para enviar cargas útiles con formato `type: "image"` y `link: url`.
- **Facebook Messenger**: El `FacebookMessageSender` envía payloads bajo el estándar de Graph API `message.attachment.type = "image"`. **Nota técnica**: Debido a restricciones en Messenger, las imágenes se envían de forma plana sin pie de foto (caption) embebido.
- **System Prompt**: Se incluyó la **REGLA DE FOTOS Y GALERÍA** en los builders de ambas IA, indicándoles cómo invocar la función `EnviarFotosSeccionPropiedad`, cooperar con `RegistrarInteresContacto` y manipular el `offset`.

## 4. Auditoría Ligera e Interceptores Multimedia (Webhooks)
Para mantener `/registros-sistema-ia` limpio y rápido sin sobrecargar la base de datos:
- **Entrada (Webhooks)**: Los controladores entrantes de Meta (WA y FB) ya no descartan los archivos multimedia. Los interpretan y los encolan a Hangfire bajo etiquetas normalizadas como `[Media: Imagen]`, `[Media: Documento]`, etc.
- **Salida (Senders)**: Cuando se despachan fotos de la IA a FB, el sender levanta un scope de Inyección de Dependencias y guarda el log estático `[Imagen]\nURL: {url}`.
- **Beneficio Colateral**: La IA del CRM gana contexto conversacional de los archivos que recibe el usuario.

## 5. UI Frontend
Se agregó un Tooltip informativo ("*Estas fotos no las ocupará la IA, solo aquellas subidas al crear secciones*") nativo de `lucide-react` en el `GalleryHeader.tsx` condicionado exclusivamente a la Galería General, garantizando la consistencia visual y previniendo la confusión operativa de los agentes.

## 6. Pruebas y Resiliencia (QA)
- Las aserciones fueron cubiertas mediante **xUnit** y **Moq** (45 pruebas completadas exitosamente).
- Se parcheó el ecosistema de Testing en Memoria (`InMemoryDatabase`) refactorizando queries específicas de PostgreSQL (`ILike`, `ExecuteUpdateAsync`) e inyectando interfaces puras para `Hangfire` (`IBackgroundJobClient`).
