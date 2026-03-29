import { api } from '@/lib/axios';

/**
 * Elimina una imagen de una propiedad de forma definitiva (Storage + DB).
 * @param propiedadId UUID de la propiedad.
 * @param imagenId UUID de la imagen multimedia.
 */
export const deleteImagenPropiedad = async (propiedadId: string, imagenId: string): Promise<void> => {
  await api.delete(`/propiedades/${propiedadId}/imagenes/${imagenId}`);
};
