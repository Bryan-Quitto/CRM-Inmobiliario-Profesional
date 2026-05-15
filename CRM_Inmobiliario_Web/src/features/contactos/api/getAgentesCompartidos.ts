import { api } from '@/lib/axios';
import type { AgenteCompartido } from '../types';

export const getAgentesCompartidos = async (contactoId: string): Promise<AgenteCompartido[]> => {
  const { data } = await api.get<AgenteCompartido[]>(`/contactos/${contactoId}/compartir`);
  return data;
};
