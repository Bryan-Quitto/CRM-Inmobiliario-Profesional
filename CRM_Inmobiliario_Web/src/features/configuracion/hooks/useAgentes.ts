import useSWR from 'swr';
import { getAgentes } from '../api/getAgentes';

export const useAgentes = (checkContactoId?: string) => {
  const url = checkContactoId ? `/configuracion/agentes?checkContactoId=${checkContactoId}` : '/configuracion/agentes';
  const { data, error, isLoading, mutate } = useSWR(url, getAgentes);

  return {
    agentes: data || [],
    isLoading,
    isError: error,
    mutate
  };
};
