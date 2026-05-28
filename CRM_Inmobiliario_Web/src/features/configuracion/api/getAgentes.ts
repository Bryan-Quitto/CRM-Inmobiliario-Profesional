import { api } from '@/lib/axios';

export interface AgenteResponse {
  id: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  email: string;
  activo: boolean;
  fotoUrl?: string;
  alreadyHasContact?: boolean;
}

export const getAgentes = async (url: string = '/configuracion/agentes'): Promise<AgenteResponse[]> => {
  const { data } = await api.get<AgenteResponse[]>(url);
  return data;
};
