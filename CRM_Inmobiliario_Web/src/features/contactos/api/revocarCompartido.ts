import { api } from '@/lib/axios';

export const revocarCompartido = async (contactoId: string, agenteIds: string[]) => {
  const { data } = await api.delete(`/contactos/${contactoId}/compartir`, { data: agenteIds });
  return data;
};
