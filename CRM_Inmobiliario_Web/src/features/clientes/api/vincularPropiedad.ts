import { api } from "../../../lib/axios";

export const vincularPropiedad = async (clienteId: string, propiedadId: string, nivelInteres: string) => {
  const response = await api.post(`/clientes/${clienteId}/intereses`, {
    propiedadId,
    nivelInteres,
  });
  return response.data;
};
