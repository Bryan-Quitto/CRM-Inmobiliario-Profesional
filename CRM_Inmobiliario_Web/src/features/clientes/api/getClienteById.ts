import { api } from '@/lib/axios';
import type { Cliente } from '../types';

export const getClienteById = async (id: string): Promise<Cliente> => {
  const { data } = await api.get<Cliente>(`/clientes/${id}`);
  return data;
};
