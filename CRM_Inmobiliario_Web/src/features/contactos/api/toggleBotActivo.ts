import { api } from '@/lib/axios';

export const toggleBotActivo = async (id: string, botActivo: boolean): Promise<void> => {
  await api.put(`/contactos/${id}/toggle-bot`, { botActivo });
};
