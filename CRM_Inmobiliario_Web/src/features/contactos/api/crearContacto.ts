import { api } from '@/lib/axios';
import type { Contacto } from '../types';

export interface CrearContactoDTO {
  nombre: string;
  apellido?: string;
  email?: string;
  telefono: string;
  origen: string;
  esContacto?: boolean;
  esPropietario?: boolean;
}

export const crearContacto = async (data: CrearContactoDTO): Promise<Contacto> => {
  const { data: response } = await api.post<Contacto>('/contactos', data);
  return response;
};
