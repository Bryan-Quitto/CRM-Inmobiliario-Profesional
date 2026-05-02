import { api } from '@/lib/axios';
import type { Contacto } from '../types';

export const getContactoById = async (id: string): Promise<Contacto> => {
  const { data } = await api.get<Contacto>(`/contactos/${id}`);
  return data;
};
