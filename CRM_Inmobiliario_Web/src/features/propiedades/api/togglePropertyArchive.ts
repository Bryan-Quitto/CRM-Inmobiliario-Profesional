import { api } from '@/lib/axios';

export const togglePropertyArchive = async (propiedadId: string): Promise<boolean> => {
  const { data } = await api.post<{ isArchived: boolean }>(`/propiedades/${propiedadId}/toggle-archive`);
  return data.isArchived;
};
