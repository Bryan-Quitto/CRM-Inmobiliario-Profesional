import { api } from '../../../lib/axios';

export interface InvitarAgenteRequest {
  email: string;
  nombre: string;
  apellido: string;
  agencia?: string;
}

export const invitarAgente = async (data: InvitarAgenteRequest) => {
  const response = await api.post('/configuracion/invitar-agente', data);
  return response.data;
};
