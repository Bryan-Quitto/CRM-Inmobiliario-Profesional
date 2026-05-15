import useSWR from 'swr';
import { getAgentes } from '../api/getAgentes';

export const useAgentes = () => {
  const { data, error, isLoading, mutate } = useSWR('/configuracion/agentes', getAgentes);

  return {
    agentes: data || [],
    isLoading,
    isError: error,
    mutate
  };
};
