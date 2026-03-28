import { api } from '@/lib/axios';
import type { Tarea } from '../types';

export const getTareaById = async (id: string): Promise<Tarea> => {
  const { data } = await api.get<Tarea>(`/tareas/${id}`);
  return data;
};
