import { api } from '@/lib/axios';

export const eliminarSeccion = async (id: string) => {
  await api.delete(`/propiedades/secciones/${id}`);
};
