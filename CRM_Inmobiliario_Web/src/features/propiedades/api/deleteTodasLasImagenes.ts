import { api } from '@/lib/axios';

/**
 * Elimina todas las imágenes de una propiedad de forma definitiva (Storage + DB).
 * @param propiedadId UUID de la propiedad.
 */
export const deleteTodasLasImagenes = async (propiedadId: string): Promise<void> => {
  await api.delete(`/propiedades/${propiedadId}/imagenes`);
};
