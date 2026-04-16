import { api } from '@/lib/axios';

export interface ImportarRemaxResponse {
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  operacion: string;
  precio: number;
  sector: string;
  ciudad: string;
  habitaciones: number;
  banos: number;
  areaTotal: number;
  areaTerreno?: number;
  areaConstruccion?: number;
  estacionamientos?: number;
  mediosBanos?: number;
  aniosAntiguedad?: number;
  direccionCompleta: string;
  urlRemax: string;
}

export const importarPropiedadRemax = async (url: string): Promise<ImportarRemaxResponse> => {
  const { data } = await api.post<ImportarRemaxResponse>('/propiedades/importar-remax', { url });
  return data;
};
