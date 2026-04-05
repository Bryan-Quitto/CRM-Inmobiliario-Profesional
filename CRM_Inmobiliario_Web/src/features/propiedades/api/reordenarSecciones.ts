import { api } from '@/lib/axios';

export const reordenarSecciones = async (propiedadId: string, seccionesIds: string[]) => {
  const { data } = await api.put(`/propiedades/${propiedadId}/secciones/orden`, { 
    propiedadId, 
    seccionesIds 
  });
  return data;
};
