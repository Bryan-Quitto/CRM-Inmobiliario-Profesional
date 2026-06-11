import { useMemo } from 'react';
import useSWR from 'swr';
import { getPropiedadesPaginated } from '../../api/getPropiedades';
import { swrDefaultConfig } from '@/lib/swr';
import type { Propiedad } from '../../types';

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  countVentas?: number;
  countAlquiler?: number;
  pageNumber: number;
  pageSize: number;
}

export const usePropiedadesData = (queryParams: URLSearchParams, checkContactoId?: string) => {
  const urlParams = new URLSearchParams(queryParams);
  if (checkContactoId) {
    urlParams.set('checkContactoId', checkContactoId);
  }

  const url = `/propiedades?${urlParams.toString()}`;
  
  const { data, isLoading, isValidating: syncing, mutate } = useSWR<PaginatedResponse<Propiedad>>(
    url,
    getPropiedadesPaginated,
    { ...swrDefaultConfig, keepPreviousData: true }
  );

  const propiedades = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const countVentas = data?.countVentas || 0;
  const countAlquiler = data?.countAlquiler || 0;

  const stats = useMemo(() => ({
    total: totalCount,
    venta: countVentas,
    alquiler: countAlquiler
  }), [totalCount, countVentas, countAlquiler]);

  const handleCoverUpdate = (propiedadId: string, newUrl: string) => {
    if (!data) return;
    
    mutate(
      {
        ...data,
        items: data.items.map(p => p.id === propiedadId ? { ...p, imagenPortadaUrl: newUrl } : p)
      },
      false
    );
  };

  return {
    propiedades,
    totalCount,
    stats,
    isLoading,
    syncing,
    mutate,
    handleCoverUpdate
  };
};
