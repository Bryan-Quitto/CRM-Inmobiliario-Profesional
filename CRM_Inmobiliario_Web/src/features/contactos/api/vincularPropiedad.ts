import { api } from "../../../lib/axios";

export const vincularPropiedad = async (contactoId: string, propiedadId: string, nivelInteres: string) => {
  const response = await api.post(`/contactos/${contactoId}/intereses`, {
    propiedadId,
    nivelInteres,
  });
  return response.data;
};
