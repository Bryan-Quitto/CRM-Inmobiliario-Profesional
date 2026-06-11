import { api } from '@/lib/axios';
import type { Propiedad } from '../types';
import type { PaginatedResponse } from '../hooks/usePropiedadesList/usePropiedadesData';

export const getPropiedadesPaginated = async (url: string = '/propiedades'): Promise<PaginatedResponse<Propiedad>> => {
  const { data } = await api.get<PaginatedResponse<Propiedad>>(url);
  return data;
};

export const getPropiedades = async (url: string = '/propiedades'): Promise<Propiedad[]> => {
  const { data } = await api.get<{items?: Propiedad[]} | Propiedad[]>(url);
  return ('items' in data && data.items) ? data.items : (Array.isArray(data) ? data : []);
};
