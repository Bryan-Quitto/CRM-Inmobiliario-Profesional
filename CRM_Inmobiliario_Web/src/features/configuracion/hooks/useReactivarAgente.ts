import { useState } from 'react';
import { reactivarAgente } from '../api/reactivarAgente';

export const useReactivarAgente = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutateAsync = async (agenteId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await reactivarAgente(agenteId);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      setError(axiosError.response?.data?.error || 'Ocurrió un error al reactivar al agente.');
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
