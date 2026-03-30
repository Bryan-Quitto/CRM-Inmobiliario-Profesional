import { api } from '@/lib/axios';

export const limpiarImagenesPropiedad = async (propiedadId: string): Promise<void> => {
  await api.delete(`/propiedades/${propiedadId}/imagenes/limpiar`);
};
