import { api } from '@/lib/axios';

export const actualizarDescripcionMultimedia = async (id: string, descripcion: string | null) => {
  await api.put(`/propiedades/imagenes/${id}/descripcion`, { descripcion });
};
