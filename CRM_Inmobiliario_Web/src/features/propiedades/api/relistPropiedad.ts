import { api } from '@/lib/axios';

export const relistPropiedad = async (id: string, notas?: string) => {
  const response = await api.post(`/propiedades/${id}/relist`, { notas });
  return response.data;
};
