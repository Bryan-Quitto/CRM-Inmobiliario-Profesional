import { api } from '@/lib/axios';
import type { Contacto } from '../types';

export const getContactos = async (): Promise<Contacto[]> => {
  const { data } = await api.get<Contacto[]>('/contactos');
  return data;
};
