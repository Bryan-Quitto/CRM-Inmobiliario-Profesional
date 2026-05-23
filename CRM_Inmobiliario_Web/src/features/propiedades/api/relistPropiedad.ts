import { api } from '@/lib/axios';

export const relistPropiedad = async (id: string, notas?: string, mode: 'Relist' | 'Cancel' = 'Relist', marcarContactoPerdido: boolean = false) => {
  const response = await api.post(`/propiedades/${id}/relist`, { notas, mode, marcarContactoPerdido });
  return response.data;
};
