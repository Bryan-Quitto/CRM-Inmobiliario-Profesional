import { api } from '@/lib/axios';
import type { Cliente } from '../types';

export interface CrearClienteDTO {
  nombre: string;
  apellido?: string;
  email?: string;
  telefono: string;
  origen: string;
  esProspecto?: boolean;
  esPropietario?: boolean;
}

export const crearCliente = async (data: CrearClienteDTO): Promise<Cliente> => {
  const { data: response } = await api.post<Cliente>('/clientes', data);
  return response;
};
