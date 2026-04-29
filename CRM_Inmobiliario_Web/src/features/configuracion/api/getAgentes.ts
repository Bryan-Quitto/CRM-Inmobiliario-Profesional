import { api } from '@/lib/axios';

export interface AgenteResponse {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email: string;
  activo: boolean;
}

export const getAgentes = async (): Promise<AgenteResponse[]> => {
  const { data } = await api.get<AgenteResponse[]>('/configuracion/agentes');
  return data;
};
