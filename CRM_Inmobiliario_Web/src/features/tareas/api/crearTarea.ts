import { api } from '@/lib/axios';
import type { Tarea, CrearTareaDTO } from '../types';

export const crearTarea = async (tarea: CrearTareaDTO): Promise<Tarea> => {
  const { data } = await api.post<Tarea>('/tareas', tarea);
  return data;
};
