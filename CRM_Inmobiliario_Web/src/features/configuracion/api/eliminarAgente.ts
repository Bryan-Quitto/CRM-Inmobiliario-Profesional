import { api } from '@/lib/axios';

export interface EliminarAgenteRequest {
  nuevoAgenteId: string;
}

export const eliminarAgente = async (agenteId: string, data: EliminarAgenteRequest) => {
  const response = await api.post(`/configuracion/agentes/${agenteId}/eliminar`, data);
  return response.data;
};
