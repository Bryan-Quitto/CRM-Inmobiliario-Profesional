import axios from '@/lib/axios';

export const relistPropiedad = async (id: string, notas?: string) => {
  const response = await axios.post(`/propiedades/${id}/relist`, { notas });
  return response.data;
};
