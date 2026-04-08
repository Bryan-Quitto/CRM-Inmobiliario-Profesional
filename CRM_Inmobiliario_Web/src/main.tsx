import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Buffer } from 'buffer'
import { Toaster } from 'sonner'

// Polyfill de Buffer para compatibilidad con librerías de PDF
window.Buffer = window.Buffer || Buffer;

import { SWRConfig } from 'swr'
import { api } from './lib/axios'
import { localStorageProvider, swrDefaultConfig } from './lib/swr'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SWRConfig 
        value={{ 
          ...swrDefaultConfig,
          fetcher: (url: string) => api.get(url).then(res => res.data),
          provider: localStorageProvider 
        }}
      >
        <Toaster richColors position="top-right" closeButton expand={true} />
        <App />
      </SWRConfig>
    </BrowserRouter>
  </StrictMode>,
)
