# Fase 5: Frontend Avanzado (Streaming y Markdown)

## 1. Intent (Propósito)
Implementar una experiencia de usuario avanzada, en tiempo real y rica en contenido visual para el Asistente de IA (Copilot). El objetivo es pasar de una UI de chat estática a una dinámica interactiva que consuma respuestas del backend carácter por carácter ("Zero Wait" typewriter effect). Además, se incorporará soporte avanzado para Markdown que transformará los enlaces específicos de propiedades en tarjetas de previsualización enriquecidas (PropertyCardPreview) y permitirá a la IA controlar de manera proactiva la navegación en la UI del CRM interceptando comandos del sistema.

## 2. Architecture (Arquitectura)
La solución se basará en la actual arquitectura dentro de `/src/features/copilot/`, incorporando las siguientes decisiones de diseño:

1. **Motor SSE (Custom Hook + Zustand Store)**
   - **Custom Hook (`useCopilotChat.ts`)**: Se encapsulará la lógica de la llamada al backend en un nuevo hook. Dado que Axios (`api`) no tiene un soporte óptimo nativo para el consumo de streams en el navegador (responseType: 'stream' es problemático en web), usaremos la API `fetch` nativa del navegador con soporte de streaming a través de `response.body.getReader()`. El hook mantendrá la responsabilidad de procesar los "chunks" mediante `TextDecoder`.
   - **Zustand Store (`useCopilotStore.ts`)**: El estado local en Zustand será la fuente de verdad. Modificaremos el store para permitir la actualización parcial y continua del último mensaje en la lista (e.g. `appendChunkToLastMessage`). Esto asegura que la UI se re-renderice suavemente con cada nuevo carácter.

2. **Renderizado Markdown Inmobiliario**
   - Se emplearán las librerías `react-markdown` y `remark-gfm` para compilar el contenido de texto plano devuelto por el stream a elementos HTML enriquecidos.
   - En lugar de renderizar directamente texto en `CopilotDrawer.tsx`, abstraeremos el mensaje a un nuevo componente `ChatMessageItem.tsx`.
   - Dentro del parseo de Markdown, interceptaremos y sobreescribiremos el renderizado del componente `a` (anchor tag). Si el enlace detectado corresponde a la firma estipulada `[🏠 Ver Ficha Completa: {Titulo}](/propiedades/{Id})`, en lugar de renderizar un `<a href="...">` estándar, renderizaremos un componente personalizado de React llamado `PropertyCardPreview.tsx`.

3. **Intercepción de Navegación**
   - El parsing en tiempo real ocurrirá en `useCopilotChat.ts`. A medida que el buffer de texto crezca en cada chunk decodificado, se evaluará una expresión regular en busca del patrón `[SystemAction: RedirectTo={path}]`.
   - Una vez detectado el patrón, ocurrirán dos cosas de forma atómica:
     1. El hook disparará `navigate(path)` usando React Router para redirigir al usuario hacia la pantalla indicada por el bot.
     2. El token técnico `[SystemAction: RedirectTo={path}]` se limpiará (stript) del string para que el texto resultante enviado a Zustand no ensucie la interfaz de usuario.

## 3. File-by-File Changes (Cambios por Archivo)

### `src/features/copilot/store/useCopilotStore.ts`
- **Acción**: Modificar
- **Detalle**: 
  - Añadir un indicador booleano de carga (`isTyping: boolean`).
  - Añadir una función `updateLastMessage(chunk: string)` que identifique el último mensaje del `assistant` y concatene el texto en tiempo real.
  - Asegurar la compatibilidad con el middleware `persist` para no saturar el almacenamiento local de forma innecesaria en cada chunk (se puede usar un debounce o persistir únicamente el estado completo tras finalizar el stream).

### `src/features/copilot/hooks/useCopilotChat.ts`
- **Acción**: Crear
- **Detalle**: 
  - Hook responsable de orquestar el envío del mensaje del usuario.
  - Utilizará `fetch('/api/chat/stream', { method: 'POST', body: ... })` configurado para streaming.
  - Implementará un bucle `while (true)` con `reader.read()` para iterar sobre el Uint8Array, decodificando con `TextDecoder()`.
  - Implementará la intercepción lógica de la cadena `\[SystemAction: RedirectTo=(.*?)\]` y su subsecuente limpieza antes de inyectar el texto restante en `updateLastMessage`.

### `src/features/copilot/components/PropertyCardPreview.tsx`
- **Acción**: Crear
- **Detalle**: 
  - Componente puramente visual que acepta `id`, `title` (y opcionalmente otros metadatos extraídos de los props de `react-markdown`).
  - Utilizará Tailwind CSS para ofrecer una visualización en formato "Tarjeta" (bordes redondeados, sombras, hover estético).
  - Incluirá interacción de click (navegación a la ficha), para lo cual deberá llevar imperativamente las clases de Tailwind necesarias para interacción, especialmente `cursor-pointer`.

### `src/features/copilot/components/ChatMessageItem.tsx`
- **Acción**: Crear
- **Detalle**: 
  - Subcomponente utilizado por el `CopilotDrawer`.
  - Envolverá la propiedad `content` dentro del componente `<ReactMarkdown>`.
  - Definirá las configuraciones visuales base para el contenido (tipografía, espacios en las listas, etc.) y la función de mapping para el nodo de ancla (`components={{ a: ({node, ...props}) => ... }}`).

### `src/features/copilot/components/CopilotDrawer.tsx`
- **Acción**: Modificar
- **Detalle**: 
  - Limpiar la lógica de renderizado del loop interno de mensajes para referenciar `ChatMessageItem`.
  - Consumir e invocar la función de envío de `useCopilotChat` en el método `handleSend` y al pulsar la tecla "Enter".
  - Reflejar visualmente el estado `isTyping` con un pequeño loader cuando corresponda antes de que el primer chunk retorne.
