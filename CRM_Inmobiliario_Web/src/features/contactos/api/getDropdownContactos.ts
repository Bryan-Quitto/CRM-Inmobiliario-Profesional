import { api } from '@/lib/axios';

export interface DropdownContactoResponse {
  id: string;
  nombre: string;
  referencia: string;
  apellido: string | null;
  telefono: string;
  etapaEmbudo: string;
  esContacto: boolean;
  esCompartido: boolean;
}

export const getDropdownContactos = async (searchQuery?: string, contexto: string = 'General'): Promise<DropdownContactoResponse[]> => {
  const url = new URL('http://localhost'); // Dummy base to easily construct search params
  if (searchQuery) {
    url.searchParams.append('searchQuery', searchQuery);
  }
  if (contexto) {
    url.searchParams.append('contexto', contexto);
  }
  
  console.log(`[getDropdownContactos] fetching URL: /contactos/dropdown${url.search}, Contexto: ${contexto}`);
  
  const { data } = await api.get<DropdownContactoResponse[]>(`/contactos/dropdown${url.search}`);
  return data;
};
