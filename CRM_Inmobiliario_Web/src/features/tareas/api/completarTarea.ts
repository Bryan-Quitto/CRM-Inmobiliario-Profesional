import { api } from '@/lib/axios';

export const completarTarea = async (id: string): Promise<void> => {
  await api.patch(`/tareas/${id}/completar`);
};
