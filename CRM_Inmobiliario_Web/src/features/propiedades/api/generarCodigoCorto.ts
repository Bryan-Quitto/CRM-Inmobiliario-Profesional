import { api } from '@/lib/axios';

export const generarCodigoCorto = async (id: string): Promise<{ codigoCorto: string }> => {
  const { data } = await api.post(`/propiedades/${id}/generar-codigo`);
  return data;
};
