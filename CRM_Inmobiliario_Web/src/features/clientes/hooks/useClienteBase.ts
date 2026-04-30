import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { getClienteById } from '../api/getClienteById';
import { getPropiedades } from '../../propiedades/api/getPropiedades';
import type { Cliente } from '../types';

export const useClienteBase = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: globalMutate } = useSWRConfig();
  
  const { data: cliente, error, isLoading, mutate } = useSWR<Cliente>(
    id ? `/clientes/${id}` : null,
    () => getClienteById(id!)
  );

  const { data: propiedadesDisponibles } = useSWR('/propiedades', getPropiedades);
  
  const propiedadesOptions = useMemo(() => {
    if (!propiedadesDisponibles) return undefined;
    return propiedadesDisponibles.map(p => ({
      id: p.id,
      title: p.titulo,
      subtitle: `${p.ciudad} - ${p.sector}`
    }));
  }, [propiedadesDisponibles]);

  return {
    id,
    cliente,
    isLoading,
    error,
    mutate,
    globalMutate,
    navigate,
    propiedadesOptions
  };
};
