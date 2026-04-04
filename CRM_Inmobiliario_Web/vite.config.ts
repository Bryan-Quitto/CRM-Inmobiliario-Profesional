import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  envDir: '../',
  plugins: [
    react({
      // @ts-expect-error - React Compiler es experimental y puede no estar en los tipos estables del plugin v6 todavía
      babel: {
        plugins: ["babel-plugin-react-compiler"]
      }
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core libraries (React & Router)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-core';
            }
            
            // UI Libraries (Icons, Toasts, DND)
            if (id.includes('lucide') || id.includes('sonner') || id.includes('@hello-pangea')) {
              return 'vendor-ui';
            }

            // Calendar (The heaviest part of the new module)
            if (id.includes('@fullcalendar')) {
              return 'vendor-calendar';
            }

            // Charts
            if (id.includes('recharts') || id.includes('d3')) {
              return 'vendor-charts';
            }
            
            // Media Utils (Heavy utility libs)
            if (id.includes('jszip') || id.includes('browser-image-compression')) {
              return 'vendor-media';
            }

            // Backend Utils (Axios, Supabase, Hook Form)
            if (id.includes('axios') || id.includes('react-hook-form') || id.includes('supabase')) {
              return 'vendor-utils';
            }

            // Other 3rd party libs
            return 'vendor-lib';
          }
        },
      },
    },
  },
})
