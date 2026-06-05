import { api } from '../../../lib/axios';

export interface ActivarAgenteInvitadoRequest {
  id: string;
  realEmail: string;
  agenciaId?: string | null;
}

export const activarAgenteInvitado = async (data: ActivarAgenteInvitadoRequest) => {
  const response = await api.post('/configuracion/activar-agente-invitado', data);
  return response.data;
};
