import { api } from '@/lib/axios';

export const actualizarEstadoPropiedad = async (
  id: string, 
  nuevoEstado: string, 
  precioCierre?: number, 
  cerradoConId?: string
): Promise<void> => {
  await api.patch(`/propiedades/${id}/estado`, { nuevoEstado, precioCierre, cerradoConId });
};
