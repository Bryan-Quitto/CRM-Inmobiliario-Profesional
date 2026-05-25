import { api } from '@/lib/axios';

export const reactivarAgente = async (agenteId: string): Promise<void> => {
  await api.post(`/configuracion/agentes/${agenteId}/reactivar`);
};
