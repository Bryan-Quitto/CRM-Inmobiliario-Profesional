import { api } from '@/lib/axios';
import type { Tarea } from '../types';

export const getTareas = async (): Promise<Tarea[]> => {
  const { data } = await api.get<Tarea[]>('/tareas');
  return data;
};
