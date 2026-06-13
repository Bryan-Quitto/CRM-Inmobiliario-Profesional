import { api } from '../../../lib/axios';

export interface InvitarAgenteRequest {
  email: string;
  agenciaId?: string | null;
}

export interface Agency {
  id: string;
  nombre: string;
  fechaCreacion: string;
  telefonoCorporativo?: string | null;
  emailCorporativo?: string | null;
  direccionFisica?: string | null;
  sitioWeb?: string | null;
  contextoCorporativoIA?: string | null;
}

export interface AgencyData {
  nombre: string;
  telefonoCorporativo?: string | null;
  emailCorporativo?: string | null;
  direccionFisica?: string | null;
  sitioWeb?: string | null;
  contextoCorporativoIA?: string | null;
}

export const invitarAgente = async (data: InvitarAgenteRequest) => {
  const response = await api.post('/configuracion/invitar-agente', data);
  return response.data;
};

export const listarAgencias = async (): Promise<Agency[]> => {
  const response = await api.get('/configuracion/agencias');
  return response.data;
};

export const crearAgencia = async (data: AgencyData): Promise<Agency> => {
  const response = await api.post('/configuracion/agencias', data);
  return response.data;
};

export const actualizarAgencia = async (id: string, data: AgencyData): Promise<Agency> => {
  const response = await api.put(`/configuracion/agencias/${id}`, data);
  return response.data;
};
