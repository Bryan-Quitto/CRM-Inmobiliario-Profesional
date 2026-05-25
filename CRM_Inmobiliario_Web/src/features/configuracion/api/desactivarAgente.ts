import { api } from '@/lib/axios';

export interface DesactivarAgenteRequest {
  nuevoAgenteId: string;
}

export const desactivarAgente = async (agenteId: string, data: DesactivarAgenteRequest): Promise<void> => {
  await api.post(`/configuracion/agentes/${agenteId}/desactivar`, data);
};
