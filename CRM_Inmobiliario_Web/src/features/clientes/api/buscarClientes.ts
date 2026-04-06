import { api } from '../../../lib/axios';

export interface ClienteBusqueda {
  id: string;
  nombreCompleto: string;
  telefono: string;
}

export const buscarClientes = async (query: string): Promise<ClienteBusqueda[]> => {
  const { data } = await api.get<ClienteBusqueda[]>(`/clientes/buscar?query=${encodeURIComponent(query)}`);
  return data;
};
