import useSWR from 'swr';
import { getPropiedadById } from '../api/getPropiedadById';
import { getHistorialPropiedad } from '../api/getHistorialPropiedad';
import { swrDefaultConfig } from '@/lib/swr';
import type { Propiedad } from '../types';

interface UsePropiedadDataProps {
  id: string;
}

export const usePropiedadData = ({ id }: UsePropiedadDataProps) => {
  const { data: propiedad, isValidating: syncing, mutate } = useSWR<Propiedad>(
    id ? `/propiedades/${id}` : null,
    () => getPropiedadById(id),
    swrDefaultConfig
  );

  const { data: historial, mutate: mutateHistorial } = useSWR(
    id ? `/propiedades/${id}/history` : null,
    () => getHistorialPropiedad(id),
    swrDefaultConfig
  );

  return {
    propiedad,
    historial,
    syncing,
    mutate,
    mutateHistorial
  };
};
