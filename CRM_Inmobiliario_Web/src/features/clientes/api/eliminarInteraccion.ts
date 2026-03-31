import { api } from '../../../lib/axios';

export const eliminarInteraccion = async (id: string) => {
  await api.delete(`/interacciones/${id}`);
};
