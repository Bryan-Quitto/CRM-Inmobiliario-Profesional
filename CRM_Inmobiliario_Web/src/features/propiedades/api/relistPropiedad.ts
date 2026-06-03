import { api } from '@/lib/axios';

export const relistPropiedad = async (id: string, notas?: string, mode: 'Relist' | 'Cancel' = 'Relist') => {
  const response = await api.post(`/propiedades/${id}/relist`, { notas, mode });
  return response.data;
};
