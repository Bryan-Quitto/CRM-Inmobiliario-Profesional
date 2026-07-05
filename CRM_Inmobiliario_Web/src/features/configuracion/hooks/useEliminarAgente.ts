import { useState } from 'react';
import { eliminarAgente, type EliminarAgenteRequest } from '../api/eliminarAgente';

export const useEliminarAgente = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = async (agenteId: string, data: EliminarAgenteRequest) => {
    setIsLoading(true);
    setError(null);
    try {
      await eliminarAgente(agenteId, data);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Ocurrió un error al eliminar al agente.');
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
