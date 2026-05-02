import { api } from '../../../lib/axios';

export const desvincularPropiedad = async (contactoId: string, propiedadId: string) => {
  await api.delete(`/contactos/${contactoId}/intereses/${propiedadId}`);
};
