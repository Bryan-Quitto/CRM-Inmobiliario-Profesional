import { api } from '@/lib/axios';
import type { Interaccion, RegistrarInteraccionDTO } from '../types';

export const registrarInteraccion = async (dto: RegistrarInteraccionDTO): Promise<Interaccion> => {
  const { data } = await api.post<Interaccion>('/interacciones', dto);
  return data;
};
