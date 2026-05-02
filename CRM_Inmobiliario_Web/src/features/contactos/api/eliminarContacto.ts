import { api } from '@/lib/axios';

export const eliminarContacto = async (id: string): Promise<void> => {
  await api.delete(`/contactos/${id}`);
};
