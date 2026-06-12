import { useMemo, useEffect } from 'react';
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

  const paramsObj = Object.fromEntries(urlParams.entries());
  
  const { data, isLoading, isValidating: syncing, mutate } = useSWR<PaginatedResponse<Propiedad>>(
    ['/propiedades', paramsObj],
    ([, p]: [string, Record<string, unknown>], extraArgs?: { signal?: AbortSignal }) => getPropiedadesPaginated({ ...p, signal: extraArgs?.signal }),
    { ...swrDefaultConfig, keepPreviousData: true }
  );

  const propiedades = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const countVentas = data?.countVentas || 0;
  const countAlquiler = data?.countAlquiler || 0;

  const totalPages = Math.ceil(totalCount / (Number(urlParams.get('pageSize')) || 50));
  const currentPage = Number(urlParams.get('pageNumber')) || 1;

  // Prefetch de la siguiente página para zero-wait
  useEffect(() => {
    if (data && currentPage < totalPages) {
      import('swr').then(({ preload }) => {
        preload(['/propiedades', { ...paramsObj, pageNumber: currentPage + 1 }], ([, p]: [string, Record<string, unknown>]) => getPropiedadesPaginated(p as Record<string, unknown>));
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, totalPages, JSON.stringify(paramsObj), data]);

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
