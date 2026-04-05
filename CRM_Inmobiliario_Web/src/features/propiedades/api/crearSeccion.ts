import { api } from '@/lib/axios';

export const crearSeccion = async (propiedadId: string, nombre: string, orden: number) => {
  const { data } = await api.post('/propiedades/secciones', { propiedadId, nombre, orden });
  return data;
};
