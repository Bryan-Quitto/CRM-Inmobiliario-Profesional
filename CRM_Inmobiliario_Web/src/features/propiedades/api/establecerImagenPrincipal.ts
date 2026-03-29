import { api } from '@/lib/axios';

export const establecerImagenPrincipal = async (propiedadId: string, imagenId: string): Promise<void> => {
  await api.patch(`/propiedades/${propiedadId}/imagenes/${imagenId}/principal`);
};
