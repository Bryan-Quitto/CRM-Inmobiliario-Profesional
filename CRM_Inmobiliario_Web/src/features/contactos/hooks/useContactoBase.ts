import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { getContactoById } from '../api/getContactoById';
import { getPropiedades } from '../../propiedades/api/getPropiedades';
import type { Contacto } from '../types';

export const useContactoBase = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { mutate: globalMutate } = useSWRConfig();
  
  const { data: contacto, error, isLoading, mutate } = useSWR<Contacto>(
    id ? `/contactos/${id}` : null,
    () => getContactoById(id!)
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
    contacto,
    isLoading,
    error,
    mutate,
    globalMutate,
    navigate,
    propiedadesOptions
  };
};
