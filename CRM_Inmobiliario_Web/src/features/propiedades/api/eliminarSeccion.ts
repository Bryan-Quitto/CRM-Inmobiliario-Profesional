import { api } from '@/lib/axios';

export const eliminarSeccion = async (id: string, deleteMedia: boolean = false) => {
  await api.delete(`/propiedades/secciones/${id}`, { params: { deleteMedia } });
};