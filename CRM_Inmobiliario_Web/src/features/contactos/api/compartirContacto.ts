import { api } from '@/lib/axios';

export const compartirContacto = async (contactoId: string, agenteIds: string[]) => {
  const { data } = await api.post(`/contactos/${contactoId}/compartir`, { agenteIds });
  return data;
};
