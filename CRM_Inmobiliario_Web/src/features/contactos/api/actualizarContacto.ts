import { api } from '@/lib/axios';

export type ActualizarContactoDTO = {
  nombre: string;
  apellido?: string;
  email?: string;
  telefono: string;
  origen: string;
  esPropietario: boolean;
};

export const actualizarContacto = async (id: string, contacto: ActualizarContactoDTO): Promise<void> => {
  await api.put(`/contactos/${id}`, contacto);
};
