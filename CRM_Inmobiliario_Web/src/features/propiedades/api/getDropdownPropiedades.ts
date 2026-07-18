import { api } from '@/lib/axios';

export interface DropdownPropiedadResponse {
  id: string;
  nombre: string;
  referencia: string;
  bloqueoAdministrativo?: boolean | null;
}

export const getDropdownPropiedades = async (searchQuery?: string): Promise<DropdownPropiedadResponse[]> => {
  const { data } = await api.get<DropdownPropiedadResponse[]>('/propiedades/dropdown', {
    params: searchQuery ? { searchQuery } : undefined
  });
  return data;
};
