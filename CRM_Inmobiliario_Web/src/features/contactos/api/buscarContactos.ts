import { api } from '../../../lib/axios';

export interface ContactoBusqueda {
  id: string;
  nombreCompleto: string;
  telefono: string;
}

export const buscarContactos = async (query: string): Promise<ContactoBusqueda[]> => {
  const { data } = await api.get<ContactoBusqueda[]>(`/contactos/buscar?query=${encodeURIComponent(query)}`);
  return data;
};
