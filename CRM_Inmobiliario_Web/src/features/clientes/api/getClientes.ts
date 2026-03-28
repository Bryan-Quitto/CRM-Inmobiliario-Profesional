import { api } from '@/lib/axios';
import type { Cliente } from '../types';

export const getClientes = async (): Promise<Cliente[]> => {
  const { data } = await api.get<Cliente[]>('/clientes');
  return data;
};
