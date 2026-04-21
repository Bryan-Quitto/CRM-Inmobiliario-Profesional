import { api } from '@/lib/axios';

export const actualizarEtapaCliente = async (
  id: string, 
  nuevaEtapa: string,
  propiedadId?: string,
  precioCierre?: number,
  nuevoEstadoPropiedad?: string
): Promise<void> => {
  await api.patch(`/clientes/${id}/etapa`, { 
    nuevaEtapa, 
    propiedadId, 
    precioCierre, 
    nuevoEstadoPropiedad 
  });
};
