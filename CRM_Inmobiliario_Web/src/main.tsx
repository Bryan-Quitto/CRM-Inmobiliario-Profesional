import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { Buffer } from 'buffer'
import { Toaster } from 'sonner'
import { configureZodLocale } from './lib/zod-locale'

// Polyfill de Buffer para compatibilidad con librerías de PDF
window.Buffer = window.Buffer || Buffer;

// Locale global de Zod en español con mensajes amigables para el usuario final.
// Los mensajes custom de cada validations.ts tienen prioridad y no se sobreescriben.
configureZodLocale();

// Monitorización global de errores para depuración de producción/test
window.onerror = function(message, source, lineno, colno, error) {
  console.group('🔥 [WINDOW_ERROR]');
  console.error('Message:', message);
  console.error('Stack:', error?.stack);
  console.error('Location:', `${source}:${lineno}:${colno}`);
  console.groupEnd();
};

window.onunhandledrejection = function(event) {
  console.group('☄️ [UNHANDLED_REJECTION]');
  console.error('Reason:', event.reason);
  if (event.reason instanceof Error) {
    console.error('Stack:', event.reason.stack);
  }
  console.groupEnd();
};

import { SWRConfig } from 'swr'
import { api } from './lib/axios'
import { localStorageProvider, swrDefaultConfig } from './lib/swr'
import './index.css'
import App from './App.tsx'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('ServiceWorker registration failed: ', err);
    });
  });
}

const router = createBrowserRouter([{ path: "*", Component: App }]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <SWRConfig 
        value={{ 
          ...swrDefaultConfig,
          fetcher: (url: string) => api.get(url).then(res => res.data),
          provider: localStorageProvider 
        }}
      >
        <Toaster richColors position="top-right" closeButton expand={true} />
        <RouterProvider router={router} />
      </SWRConfig>
  </StrictMode>,
)
