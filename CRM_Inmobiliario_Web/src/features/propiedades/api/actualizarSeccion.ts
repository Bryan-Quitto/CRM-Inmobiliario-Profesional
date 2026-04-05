import { api } from '@/lib/axios';

export const actualizarSeccion = async (id: string, nombre: string, descripcion: string | null, orden: number) => {
  await api.put(`/propiedades/secciones/${id}`, { nombre, descripcion, orden });
};
