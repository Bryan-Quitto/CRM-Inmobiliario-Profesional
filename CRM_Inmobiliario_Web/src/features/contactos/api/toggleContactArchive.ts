import { api } from '@/lib/axios';

export const toggleContactArchive = async (contactoId: string): Promise<boolean> => {
  const { data } = await api.post<{ isArchived: boolean }>(`/contactos/${contactoId}/toggle-archive`);
  return data.isArchived;
};
