import { useMemo } from 'react';
import useSWR from 'swr';
import { getPropiedades } from '../../api/getPropiedades';
import { swrDefaultConfig } from '@/lib/swr';
import type { Propiedad } from '../../types';

export const usePropiedadesData = () => {
  const { data: propiedades = [], isLoading, isValidating: syncing, mutate } = useSWR<Propiedad[]>(
    '/propiedades',
    getPropiedades,
    swrDefaultConfig
  );

  const stats = useMemo(() => ({
    total: propiedades.length,
    venta: propiedades.filter(p => p.operacion === 'Venta').length,
    alquiler: propiedades.filter(p => p.operacion === 'Alquiler').length
  }), [propiedades]);

  const handleCoverUpdate = (propiedadId: string, newUrl: string) => {
    mutate(
      propiedades.map(p => p.id === propiedadId ? { ...p, imagenPortadaUrl: newUrl } : p),
      false
    );
  };

  return {
    propiedades,
    stats,
    isLoading,
    syncing,
    mutate,
    handleCoverUpdate
  };
};
