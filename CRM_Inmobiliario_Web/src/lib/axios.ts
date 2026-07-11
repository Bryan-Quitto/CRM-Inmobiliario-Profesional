import axios from 'axios';
import { toast } from 'sonner';
import { supabase } from './supabase';
import { usePendingOperationsStore } from '@/store/usePendingOperationsStore';

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
        // Prevenir el uso de un token caducado (margen de 15 segundos)
        if (data.access_token && data.expires_at) {
          const now = Math.floor(Date.now() / 1000);
          if (data.expires_at > now + 15) {
            return data.access_token;
          }
          return null; // Token caducado o a punto de expirar, forzar refresh
        }
        return data.access_token || null;
      }
    }
  } catch { /* ignore */ }
  return null;
};

// Variable global para mantener el token en memoria sin bloqueos
let memoryToken: string | null = getLocalTokenSync();

// Variables para manejar la concurrencia de refresco de tokens tras un 401
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void, reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

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
  // Blindaje Global: Registrar operación pendiente si es mutación (no GET)
  if (config.method && config.method.toLowerCase() !== 'get') {
    usePendingOperationsStore.getState().addPendingOperation();
  }

  try {
    // Zero-Wait: Usar token en memoria instantáneamente
    if (memoryToken) {
      config.headers.Authorization = `Bearer ${memoryToken}`;
    } else {
      // Fallback extremo protegido contra Thundering Herd de Promise locks
      // Si memoryToken es null (porque expiró), getSession forzará una renovación segura
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
  (response) => {
    if (response.config.method && response.config.method.toLowerCase() !== 'get') {
      usePendingOperationsStore.getState().removePendingOperation();
    }
    return response;
  },
  (error) => {
    if (error.config?.method && error.config.method.toLowerCase() !== 'get') {
      usePendingOperationsStore.getState().removePendingOperation();
    }

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

    // Errores de Autenticación (401)
    if (error.response?.status === 401) {
      const originalRequest = error.config as import('axios').InternalAxiosRequestConfig & { _retry?: boolean };
      
      if (originalRequest && !originalRequest._retry) {
        if (isRefreshing) {
          // Si ya se está refrescando, poner la petición en la cola para reintentarla después
          return new Promise(function(resolve, reject) {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return api(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        return (async () => {
          try {
            // refreshSession fuerza la actualización usando el refresh_token
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !data.session) {
              processQueue(refreshError || new Error('No session'), null);
              await supabase.auth.signOut();
              window.location.href = '/login';
              throw error;
            } else {
              const newToken = data.session.access_token;
              memoryToken = newToken;
              processQueue(null, newToken);
              originalRequest.headers.Authorization = 'Bearer ' + newToken;
              return api(originalRequest);
            }
          } catch (err) {
            processQueue(err, null);
            await supabase.auth.signOut();
            window.location.href = '/login';
            throw err;
          } finally {
            isRefreshing = false;
          }
        })();
      } else {
        // Si ya fue reintentado y sigue fallando, la sesión es irreversiblemente inválida
        supabase.auth.signOut().then(() => {
          window.location.href = '/login';
        });
      }
    }

    // Errores de Baneo / Falta de Permisos (403)
    if (error.response?.status === 403) {
      supabase.auth.signOut().then(() => {
        window.location.href = '/login';
      });
    }

    // Traducción global y extracción de mensajes limpios del backend (ProblemDetails RFC 7807)
    if (error.response) {
      const data = error.response.data;
      if (data && typeof data === 'object') {
        // detail es típicamente donde ponemos nuestros mensajes de dominio en Results.Problem
        const mensajeBackend = data.detail || data.title;
        if (mensajeBackend) {
          error.message = mensajeBackend;
        } else if (error.response.status >= 500) {
          error.message = 'Ocurrió un error interno en el servidor. Nuestro equipo ha sido notificado.';
        } else if (error.response.status >= 400) {
          error.message = 'La solicitud no pudo procesarse correctamente.';
        }
      } else if (error.response.status >= 500) {
        error.message = 'Ocurrió un error interno en el servidor. Nuestro equipo ha sido notificado.';
      } else {
        error.message = 'Ocurrió un error inesperado al contactar con el servidor.';
      }
    } else if (error.message === 'Network Error') {
      error.message = 'Error de red. Verifica tu conexión a internet.';
    }

    return Promise.reject(error);
  }
);
