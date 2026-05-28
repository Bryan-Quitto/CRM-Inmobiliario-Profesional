import { api } from '@/lib/axios';
import type { Propiedad } from '../types';

export const getPropiedades = async (url: string = '/propiedades'): Promise<Propiedad[]> => {
  const { data } = await api.get<Propiedad[]>(url);
  return data;
};
