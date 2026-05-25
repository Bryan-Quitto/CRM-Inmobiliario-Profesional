import { useState } from 'react';
import { desactivarAgente, type DesactivarAgenteRequest } from '../api/desactivarAgente';

export const useDesactivarAgente = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = async (agenteId: string, data: DesactivarAgenteRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await desactivarAgente(agenteId, data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Ocurrió un error al desactivar al agente.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    mutateAsync,
    isLoading,
    error,
  };
};
