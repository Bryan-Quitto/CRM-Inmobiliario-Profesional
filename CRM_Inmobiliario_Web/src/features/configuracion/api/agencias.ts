import { api } from '../../../lib/axios';

export interface InvitarAgenteRequest {
  email: string;
  agenciaId?: string | null;
}

export interface Agency {
  id: string;
  nombre: string;
  fechaCreacion: string;
}

export const invitarAgente = async (data: InvitarAgenteRequest) => {
  const response = await api.post('/configuracion/invitar-agente', data);
  return response.data;
};

export const listarAgencias = async (): Promise<Agency[]> => {
  const response = await api.get('/configuracion/agencias');
  return response.data;
};

export const crearAgencia = async (nombre: string): Promise<Agency> => {
  const response = await api.post('/configuracion/agencias', { nombre });
  return response.data;
};
