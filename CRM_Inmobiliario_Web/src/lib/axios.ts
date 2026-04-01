import axios from 'axios';
import { toast } from 'sonner';

export const api = axios.create({
  baseURL: 'http://localhost:5164/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 segundos de timeout
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si no hay respuesta del servidor (Error de Red)
    if (!error.response) {
      toast.error('Error de comunicación con el servidor', {
        description: 'No se pudo contactar con el sistema. Verifica tu conexión o intenta más tarde.',
        id: 'network-error-api'
      });
    }

    // Errores de Timeout
    if (error.code === 'ECONNABORTED') {
      toast.error('La petición ha tardado demasiado', {
        description: 'El servidor está tardando en responder. Intenta de nuevo.',
      });
    }

    return Promise.reject(error);
  }
);
