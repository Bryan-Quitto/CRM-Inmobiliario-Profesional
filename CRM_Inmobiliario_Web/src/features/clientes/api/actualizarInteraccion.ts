import { api } from '../../../lib/axios';

export const actualizarInteraccion = async (id: string, notas: string, tipoInteraccion: string) => {
  await api.put(`/interacciones/${id}`, { notas, tipoInteraccion });
};
