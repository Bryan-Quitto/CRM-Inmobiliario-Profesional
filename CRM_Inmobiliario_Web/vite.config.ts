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
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 1. Core React & DOM
            if (id.includes('node_modules/react-dom/')) return 'vendor-dom';
            if (id.includes('node_modules/react/')) return 'vendor-react';
            
            // 2. Routing (React Router + Internal Remix packages)
            if (id.includes('react-router') || id.includes('@remix-run')) return 'vendor-router';

            // 3. Heavy Engine: PDF (Lazy loaded in UI)
            if (id.includes('@react-pdf')) return 'vendor-pdf';
            
            // 4. Heavy Engine: Calendar
            if (id.includes('@fullcalendar')) return 'vendor-calendar';

            // 5. Heavy Engine: Charts
            if (id.includes('recharts') || id.includes('d3')) return 'vendor-charts';
            
            // 6. UI: Icons (Lucide can be big if many are used)
            if (id.includes('lucide-react')) return 'vendor-icons';

            // 7. UI: Components (Sonner, DnD)
            if (id.includes('sonner') || id.includes('@hello-pangea')) return 'vendor-ui-core';

            // 8. Storage & Logic (Supabase, Axios)
            if (id.includes('@supabase') || id.includes('axios')) return 'vendor-backend';

            // 9. Heavy Utils: JSZip (Very heavy)
            if (id.includes('jszip')) return 'vendor-jszip';

            // 10. Media & Compression
            if (id.includes('browser-image-compression') || id.includes('buffer')) return 'vendor-media';

            // 11. Forms & State
            if (id.includes('swr') || id.includes('react-hook-form')) return 'vendor-logic';

            // El resto que sea realmente pequeño
            return 'vendor-misc';
          }
        },
      },
    },
  },
})
