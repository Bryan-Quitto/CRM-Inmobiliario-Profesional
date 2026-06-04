# Fase 6: Panel de Auditoría IA (Logs)

## Intent
El objetivo de la Fase 6 es rediseñar y extender la vista de auditoría de IA (actualmente alojada en `/ia-logs`). El cambio principal consiste en convertir la ruta en un layout maestro (`IaLogsLayout.tsx`) con un menú de navegación horizontal estilo "tabs". Además de la auditoría existente de WhatsApp (que pasará a ser una pestaña), introduciremos la vista **PersonalLogsView** para revisar el historial de conversaciones directas del agente con el Copilot (`AgentConversation`). Esta nueva vista incorporará búsqueda rápida en el cliente mediante `fuse.js` y una experiencia de borrado fluida ("Borrado Express") con notificaciones Toast interactivas, eliminando los modales bloqueantes.

## Architecture

1. **Layout Maestro (`IaLogsLayout.tsx`)**
   - Centralizará la navegación para la sección de auditoría en `/ia-logs`.
   - Utilizará el patrón de pestañas horizontales (`NavMenu`) para cambiar entre los canales: WhatsApp, Facebook, Personal y General.
   - Actuará como un wrapper para las subrutas mediante `<Outlet />` de `react-router-dom`.

2. **Ruta WhatsApp (`/ia-logs/whatsapp`)**
   - Migración de la lógica y UI actual contenida en `<AuditoriaLogsView />` a esta subruta.
   - Preserva la funcionalidad existente de auditoría de interacciones de los leads con el bot.

3. **Ruta Personal (`/ia-logs/personal` -> `PersonalLogsView.tsx`)**
   - Consumirá el endpoint de historial de conversaciones (desarrollado en la Fase 2) mediante `SWR` y la instancia configurada `api` de axios (`import { api } from '@/lib/axios'`).
   - **Buscador fuse.js**: Todo el arreglo de conversaciones devuelto por la API se indexará en el lado del cliente utilizando `fuse.js`. Un campo de entrada permitirá filtrar instantáneamente por contenido, fecha o título sin llamadas adicionales a la red.
   - **Máquina de estados de Borrado Express**:
     - Cada fila/tarjeta de conversación tendrá un ícono de eliminar.
     - Al hacer clic, el ícono transiciona de manera inline a dos acciones: Confirmar (`✔`) o Cancelar (`✖`).
     - Al confirmar, el elemento se remueve optimísticamente del estado local/caché de SWR.
     - Se lanza un `toast.success` utilizando la librería `sonner` que incluirá una acción "Deshacer". Si el usuario elige deshacer, el elemento regresa a la vista; si no, se consolida la petición `DELETE` en background.

## File-by-File Changes

### 1. `src/App.tsx`
- **Action**: Modify
- **Changes**:
  - Reemplazar la ruta directa `/ia-logs` (que apuntaba a `AuditoriaLogsView`) por un bloque de rutas anidadas en el nuevo layout maestro.
  - Implementar la redirección por defecto de `/ia-logs` a `/ia-logs/whatsapp`.
  - Definir las rutas `/ia-logs/whatsapp` (usando `AuditoriaLogsView`) y `/ia-logs/personal` (usando `PersonalLogsView`).
  - Mantener el lazy loading para todas las vistas, aplicando el `Suspense` y `PageLoader` donde corresponda.

### 2. `src/features/ia/components/IaLogsLayout.tsx`
- **Action**: Create
- **Changes**:
  - Implementar el diseño visual del Layout Maestro con un NavMenu horizontal.
  - Las pestañas deben diseñarse siguiendo un esquema estilizado (por ejemplo, alineadas con la UI de perfil actual), utilizando Tailwind CSS y texto en español.
  - Todos los elementos interactivos del menú deben obligatoriamente incorporar la clase `cursor-pointer`.
  - Incluir el componente `<Outlet />` para inyectar el contenido de las subrutas.

### 3. `src/features/ia/components/AuditoriaLogsView.tsx`
- **Action**: Modify (Minor)
- **Changes**:
  - Adaptar ligeramente los paddings y márgenes del contenedor principal si es necesario para que encaje armónicamente dentro del nuevo `IaLogsLayout`.
  - Retirar cualquier cabecera global repetida que ahora sea responsabilidad del layout maestro.

### 4. `src/features/ia/components/PersonalLogsView.tsx`
- **Action**: Create
- **Changes**:
  - Crear el componente funcional principal para el historial del Copilot.
  - Importar `import { api } from '@/lib/axios'` y utilizar `SWR` para el data fetching inicial.
  - Integrar `fuse.js` para inicializar el motor de búsqueda en el cliente tan pronto como se reciban los datos. Ligar la salida del buscador a la lista renderizada.
  - Diseñar la lista de logs con una estética limpia e interacciones suaves, utilizando íconos de `lucide-react`.
  - Implementar el "Borrado Express":
    - Usar estado local para mapear qué ID está en "modo confirmación".
    - Renderizar los botones inline (✔/✖) con `cursor-pointer`.
    - Usar la función `toast` de `sonner` para la notificación deshacer (`action: { label: 'Deshacer', onClick: () => revertir() }`).

### 5. `src/features/ia/hooks/usePersonalLogs.ts` (Opcional pero Recomendado)
- **Action**: Create
- **Changes**:
  - Extraer la lógica de fetching, configuración de `fuse.js` y el estado del borrado optimista a un custom hook para adherir a la arquitectura Feature-Sliced Design y mantener la vista limpia.
