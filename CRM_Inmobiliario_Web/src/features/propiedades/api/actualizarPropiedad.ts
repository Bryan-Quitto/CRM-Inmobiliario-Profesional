import { api } from '@/lib/axios';

export type ActualizarPropiedadDTO = {
  titulo: string;
  descripcion: string;
  tipoPropiedad: string;
  operacion: string;
  precio: number;
  direccion: string;
  sector: string;
  ciudad: string;
  habitaciones: number;
  banos: number;
  areaTotal: number;
  esCaptacionPropia: boolean;
  porcentajeComision: number;
};

export const actualizarPropiedad = async (id: string, propiedad: ActualizarPropiedadDTO): Promise<void> => {
  await api.put(`/propiedades/${id}`, propiedad);
};
