import { api } from '@/lib/axios';

export const limpiarImagenesPropiedad = async (propiedadId: string, soloGeneral: boolean = false): Promise<void> => {
  await api.delete(`/propiedades/${propiedadId}/imagenes/limpiar`, { params: { soloGeneral } });
};