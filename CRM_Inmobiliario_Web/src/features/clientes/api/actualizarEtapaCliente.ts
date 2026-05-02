import { api } from '@/lib/axios';

export const actualizarEtapaCliente = async (
  id: string, 
  nuevaEtapa: string,
  propiedadId?: string,
  precioCierre?: number,
  nuevoEstadoPropiedad?: string,
  tipo: 'prospecto' | 'propietario' = 'prospecto'
): Promise<void> => {
  await api.patch(`/clientes/${id}/etapa`, { 
    nuevaEtapa, 
    propiedadId, 
    precioCierre, 
    nuevoEstadoPropiedad,
    tipo
  });
};
