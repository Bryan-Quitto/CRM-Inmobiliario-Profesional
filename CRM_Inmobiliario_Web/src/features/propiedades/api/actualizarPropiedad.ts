import { api } from '@/lib/axios';

export interface NuevoCaptadorRequest {
  nombre: string;
  apellido: string;
  telefono?: string;
}

export type ActualizarPropiedadDTO = {
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  operacion: string;
  precio: number;
  direccion: string;
  sector: string;
  ciudad: string;
  googleMapsUrl?: string;
  habitaciones: number;
  banos: number;
  areaTotal: number;
  esCaptacionPropia: boolean;
  captadorId?: string;
  nuevoCaptador?: NuevoCaptadorRequest;
  porcentajeComision: number;
  fechaIngreso?: string;
};

export const actualizarPropiedad = async (id: string, propiedad: ActualizarPropiedadDTO): Promise<void> => {
  await api.put(`/propiedades/${id}`, propiedad);
};
