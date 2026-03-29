import { api } from '@/lib/axios';

/**
 * Elimina un grupo de imágenes seleccionadas de una propiedad.
 * @param propiedadId UUID de la propiedad.
 * @param ids Lista de UUIDs de las imágenes a eliminar.
 */
export const deleteImagenesSeleccionadas = async (propiedadId: string, ids: string[]): Promise<void> => {
  await api.delete(`/propiedades/${propiedadId}/imagenes/seleccion`, {
    data: ids
  });
};
