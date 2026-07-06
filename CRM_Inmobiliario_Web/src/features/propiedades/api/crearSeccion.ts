import { api } from '@/lib/axios';

export const crearSeccion = async (propiedadId: string, nombre: string, descripcion: string, orden: number) => {
  const { data } = await api.post('/propiedades/secciones', { propiedadId, nombre, descripcion, orden });
  return data;
};
