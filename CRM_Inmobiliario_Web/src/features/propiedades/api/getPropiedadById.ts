import { api } from '@/lib/axios';
import type { Propiedad } from '../types';

export const getPropiedadById = async (id: string): Promise<Propiedad> => {
  const { data } = await api.get<Propiedad>(`/propiedades/${id}`);
  return data;
};
