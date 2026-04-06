import { api } from '../../../lib/axios';

export interface PropiedadBusqueda {
  id: string;
  titulo: string;
  ciudad: string;
  sector: string;
}

export const buscarPropiedades = async (query: string): Promise<PropiedadBusqueda[]> => {
  const { data } = await api.get<PropiedadBusqueda[]>(`/propiedades/buscar?query=${encodeURIComponent(query)}`);
  return data;
};
