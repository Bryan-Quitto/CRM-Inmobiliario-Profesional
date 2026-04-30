import { api } from '@/lib/axios';

export type ActualizarClienteDTO = {
  nombre: string;
  apellido?: string;
  email?: string;
  telefono: string;
  origen: string;
  esPropietario: boolean;
};

export const actualizarCliente = async (id: string, cliente: ActualizarClienteDTO): Promise<void> => {
  await api.put(`/clientes/${id}`, cliente);
};
