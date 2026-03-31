import { api } from '../../../lib/axios';

export const desvincularPropiedad = async (clienteId: string, propiedadId: string) => {
  await api.delete(`/clientes/${clienteId}/intereses/${propiedadId}`);
};
