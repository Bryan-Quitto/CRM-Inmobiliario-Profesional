import { api } from '@/lib/axios';
import type { CrearTareaDTO } from '../types';

export const actualizarTarea = async (id: string, tarea: CrearTareaDTO): Promise<void> => {
  await api.put(`/tareas/${id}`, tarea);
};
