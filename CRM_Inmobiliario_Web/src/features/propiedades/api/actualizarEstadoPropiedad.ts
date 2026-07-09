import { api } from '@/lib/axios';

export const actualizarEstadoPropiedad = async (
  id: string, 
  nuevoEstado: string, 
  precioCierre?: number, 
  montoReserva?: number,
  cerradoConId?: string,
  agenteCerradorId?: string,
  version?: string
): Promise<void> => {
  await api.patch(`/propiedades/${id}/estado`, { nuevoEstado, precioCierre, montoReserva, cerradoConId, agenteCerradorId, version });
};
