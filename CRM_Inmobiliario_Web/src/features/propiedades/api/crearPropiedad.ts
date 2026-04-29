import { api } from '@/lib/axios';
import type { Propiedad } from '../types';

export interface NuevoCaptadorRequest {
  nombre: string;
  apellido: string;
  telefono?: string;
}

export type CrearPropiedadDTO = Omit<Propiedad, 'id' | 'estadoComercial' | 'fechaIngreso'> & {
  descripcion: string;
  direccion: string;
  habitaciones: number;
  banos: number;
  areaTotal: number;
  esCaptacionPropia: boolean;
  captadorId?: string;
  nuevoCaptador?: NuevoCaptadorRequest;
  porcentajeComision: number;
  fechaIngreso?: string;
};

export const crearPropiedad = async (propiedad: CrearPropiedadDTO): Promise<Propiedad> => {
  const { data } = await api.post<Propiedad>('/propiedades', propiedad);
  return data;
};
