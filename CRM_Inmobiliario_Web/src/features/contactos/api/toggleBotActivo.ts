import { api } from '@/lib/axios';

export const toggleBotActivo = async (id: string, botActivo: boolean, channel: 'WhatsApp' | 'Facebook' = 'WhatsApp'): Promise<void> => {
  await api.put(`/contactos/${id}/toggle-bot`, { botActivo, channel });
};
