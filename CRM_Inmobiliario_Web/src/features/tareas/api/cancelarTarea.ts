import { api } from '@/lib/axios';

export const cancelarTarea = async (id: string): Promise<void> => {
  await api.patch(`/tareas/${id}/cancelar`);
};
