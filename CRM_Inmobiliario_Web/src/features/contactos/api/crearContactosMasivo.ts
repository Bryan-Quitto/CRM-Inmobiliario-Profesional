import { api } from '@/lib/axios';

export interface CrearContactoMasivoDto {
  nombre: string;
  apellido: string;
  email?: string | null;
  telefono?: string | null;
  origen: string;
  esCliente: boolean;
  esPropietario: boolean;
}

export interface RegistrarContactosMasivoCommand {
  contactos: CrearContactoMasivoDto[];
}

export interface RegistrarContactosMasivoResponse {
  message: string;
  count: number;
}

export const registrarContactosMasivo = async (data: RegistrarContactosMasivoCommand): Promise<RegistrarContactosMasivoResponse> => {
  const response = await api.post<RegistrarContactosMasivoResponse>('/contactos/masivo', data);
  return response.data;
};
