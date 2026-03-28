import { api } from '@/lib/axios';
import type { Propiedad } from '../types';

export const getPropiedades = async (): Promise<Propiedad[]> => {
  const { data } = await api.get<Propiedad[]>('/propiedades');
  return data;
};
