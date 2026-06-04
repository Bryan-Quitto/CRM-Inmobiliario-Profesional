# Fase 4: Fundación Frontend (UI/UX) - Web AI Bot

## 1. Intención (Intent)
Establecer la base de la interfaz de usuario para el Asistente de IA (Copilot) mediante un "Drawer Global" (panel lateral) accesible desde cualquier punto de la aplicación. Además, implementar la política de "Zero Wait" (Persistencia UPSP) para que el contexto del chat (mensajes y ID de conversación) sobreviva a recargas completas (F5) del navegador, proporcionando una experiencia premium e ininterrumpida.

## 2. Arquitectura y Decisiones de Diseño

### 2.1 Feature-Sliced Design
Se creará un nuevo dominio bajo `src/features/copilot` para aislar toda la lógica, estado y UI del asistente.

### 2.2 Gestión de Estado (Persistencia UPSP)
Se incorporará **Zustand** con su middleware `persist` acoplado a `localStorage`. Esto permite:
1. Recuperación instantánea del historial de la conversación activa sin *loaders*.
2. Manejo global del estado de visibilidad del Drawer (`isOpen`), eliminando el *prop-drilling* y permitiendo abrir el Copilot desde otras interacciones futuras.

### 2.3 UI / UX y Animaciones (Tailwind CSS)
El `CopilotDrawer` será un panel fijo que se deslizará desde la derecha con animaciones suaves de Tailwind.
- **Efecto Slide-In:** Clases combinadas de `translate-x` y `transition-transform duration-300 ease-in-out` para garantizar 60fps constantes.
- **Estética Premium:** Uso de `shadow-2xl`, bordes sutiles `border-l border-slate-200`, fondos blancos con blur si aplica, y uso de iconos atractivos (`Sparkles` / `Bot` de `lucide-react`).

## 3. Estructura del Estado (Zustand)

```typescript
// src/features/copilot/store/useCopilotStore.ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface CopilotState {
  isOpen: boolean;
  conversationId: string | null;
  messages: ChatMessage[];
  // Acciones
  toggleOpen: () => void;
  setOpen: (open: boolean) => void;
  addMessage: (msg: ChatMessage) => void;
  setConversationId: (id: string) => void;
  clearConversation: () => void;
}
```

## 4. Cambios Archivo por Archivo

### `package.json`
- **Acción:** Instalar `zustand`.
- **Razón:** Necesario para manejar el store global con middleware de persistencia.

### `src/features/copilot/store/useCopilotStore.ts` (Nuevo Archivo)
- **Acción:** Crear el store usando `create` y el middleware `persist` con key `crm_copilot_storage`.
- **Lógica `Nueva Conversación`:** La función `clearConversation` simplemente restablecerá `conversationId` a `null` y `messages` a un arreglo vacío, forzando la UI a prepararse inmediatamente para un contexto nuevo.

### `src/features/copilot/components/CopilotDrawer.tsx` (Nuevo Archivo)
- **Estructura:** 
  - *Header:* Título "Asistente de IA" (o similar), un botón de cerrar (`X`) y un botón prominente "Nueva Conversación" (ícono de `Plus` o `RefreshCcw`).
  - *Body:* Lista renderizada de los `messages` extraídos del store.
  - *Footer:* Input de texto y botón de enviar (base visual preparada para la integración con API).
- **Estilos:** `<aside className={\`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out \${isOpen ? 'translate-x-0' : 'translate-x-full'}\`}>`

### `src/components/layout/Header.tsx`
- **Acción:** Importar `useCopilotStore` e incorporar un nuevo botón en la botonera principal.
- **UI:** Botón atractivo con el ícono `Sparkles` (y quizás un badge o glow sutil) al lado derecho o izquierdo del botón de Notificaciones (`Bell`).

### `src/App.tsx`
- **Acción:** Importar `CopilotDrawer` y montarlo globalmente en el árbol principal.
- **Detalle:** Deberá ubicarse en el mismo nivel que `<Sidebar />` o `<AgendaPanel />` para no ser condicionado por los contenedores de rutas limitados, asegurando que se superponga sobre todo el contenido (`z-50`).

## 5. Criterios de Aceptación y Restricciones
- [ ] La interfaz utiliza **Tailwind CSS** puro mediante clases utilitarias, sin CSS in-line.
- [ ] Textos exclusivamente en **Español**.
- [ ] Los archivos (componentes, hooks) **no excederán las 250 líneas** de código.
- [ ] El ciclo de vida de persistencia en `localStorage` no debe causar desfases visuales ("Zero Wait Policy"). Al pulsar F5, el historial debe visualizarse en el primer render.
- [ ] **Nueva Conversación:** Al hacer clic, la UI limpia los mensajes de inmediato.
