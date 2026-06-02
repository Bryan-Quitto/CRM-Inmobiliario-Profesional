import { api } from '@/lib/axios';
import type { Propiedad } from '../types';

export const getPropiedades = async (url: string = '/propiedades'): Promise<Propiedad[]> => {
  const { data } = await api.get<{items?: Propiedad[]} | Propiedad[]>(url);
  return ('items' in data && data.items) ? data.items : (Array.isArray(data) ? data : []);
};
