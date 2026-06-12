import { api } from '@/lib/axios';

export interface DropdownPropiedadResponse {
  id: string;
  nombre: string;
  referencia: string;
}

export const getDropdownPropiedades = async (searchQuery?: string): Promise<DropdownPropiedadResponse[]> => {
  const url = new URL('/api/propiedades/dropdown', window.location.origin);
  if (searchQuery) {
    url.searchParams.append('searchQuery', searchQuery);
  }
  const { data } = await api.get<DropdownPropiedadResponse[]>(url.pathname + url.search);
  return data;
};
