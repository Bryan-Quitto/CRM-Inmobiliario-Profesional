import axios from 'axios';
import { toast } from 'sonner';
import { supabase } from './supabase';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://localhost:7046/api',
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true', // Necesario para saltar la pantalla de advertencia de ngrok en peticiones AJAX
    'bypass-tunnel-reminder': 'true' // Necesario para saltar la pantalla de advertencia de Localtunnel en peticiones AJAX
  },
  timeout: 15000, // 15 segundos de timeout
});

// Precargar el token al inicio buscando directamente en el localStorage para Zero-Wait sincrónico
const getLocalTokenSync = () => {
  if (typeof window === 'undefined') return null;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('sb-') && key?.endsWith('-auth-token')) {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        return data.access_token || null;
      }
    }
  } catch { /* ignore */ }
  return null;
};

// Variable global para mantener el token en memoria sin bloqueos
let memoryToken: string | null = getLocalTokenSync();

// Escuchar cambios de sesión en tiempo real para refrescos futuros
supabase.auth.onAuthStateChange((event, session) => {
  if (session?.access_token) {
    memoryToken = session.access_token;
  } else if (event === 'SIGNED_OUT') {
    memoryToken = null;
  }
});

let sessionPromise: Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>> | null = null;

// Interceptor para inyectar el token JWT de Supabase
api.interceptors.request.use(async (config) => {
  try {
    // Zero-Wait: Usar token en memoria instantáneamente
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    } else {
      // Fallback extremo protegido contra Thundering Herd de Promise locks
      if (!sessionPromise) {
        sessionPromise = supabase.auth.getSession();
      }
      const { data: { session } } = await sessionPromise;
      sessionPromise = null; // Clean up
      
      if (session?.access_token) {
        memoryToken = session.access_token;
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    }
  } catch {
    sessionPromise = null;
  }
  
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Peticiones canceladas por AbortSignal (SWR cancela al cambiar de página rápido)
    // NO son errores reales — ignorar silenciosamente sin mostrar toast
    if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError') {
      return Promise.reject(error);
    }

    // Si no hay respuesta del servidor (Error de Red)
    if (!error.response) {
      toast.error('Error de comunicación con el servidor', {
        description: 'No se pudo contactar con el sistema. Verifica tu conexión o intenta más tarde.',
        id: 'network-error-api'
      });
    }

    // Errores de Timeout (solo timeouts reales, no cancelaciones)
    if (error.code === 'ECONNABORTED') {
      toast.error('La petición ha tardado demasiado', {
        description: 'El servidor está tardando en responder. Intenta de nuevo.',
      });
    }

    // Errores de Autenticación / Baneo
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Forzar cierre de sesión si el token es inválido o el usuario fue bloqueado
      supabase.auth.signOut().then(() => {
        window.location.href = '/login';
      });
    }

    return Promise.reject(error);
  }
);
