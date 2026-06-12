import { api } from '@/lib/axios';
import type { Propiedad } from '../types';
import type { PaginatedResponse } from '../hooks/usePropiedadesList/usePropiedadesData';

interface GetPropiedadesParams {
  [key: string]: unknown;
  signal?: AbortSignal;
}

export const getPropiedadesPaginated = async (params: GetPropiedadesParams): Promise<PaginatedResponse<Propiedad>> => {
  const { signal, ...queryParams } = params;
  const { data } = await api.get<PaginatedResponse<Propiedad>>('/propiedades', {
    params: queryParams,
    signal
  });
  return data;
};

export const getPropiedades = async (url: string = '/propiedades'): Promise<Propiedad[]> => {
  const { data } = await api.get<{items?: Propiedad[]} | Propiedad[]>(url);
  return ('items' in data && data.items) ? data.items : (Array.isArray(data) ? data : []);
};
