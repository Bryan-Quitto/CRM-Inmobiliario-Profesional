import { api } from '@/lib/axios';

export const actualizarEtapaContacto = async (
  id: string, 
  nuevaEtapa: string,
  propiedadId?: string,
  precioCierre?: number,
  nuevoEstadoPropiedad?: string,
  tipo: 'contacto' | 'propietario' = 'contacto'
): Promise<void> => {
  await api.patch(`/contactos/${id}/etapa`, { 
    nuevaEtapa, 
    propiedadId, 
    precioCierre, 
    nuevoEstadoPropiedad,
    tipo
  });
};
