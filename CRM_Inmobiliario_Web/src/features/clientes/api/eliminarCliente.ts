import { api } from '@/lib/axios';

export const eliminarCliente = async (id: string): Promise<void> => {
  await api.delete(`/clientes/${id}`);
};
