import { api } from '@/lib/axios';

export const actualizarEstadoContacto = async (
  id: string, 
  nuevoEstado: string,
  propiedadId?: string,
  precioCierre?: number,
  nuevoEstadoPropiedad?: string,
  tipo: 'contacto' | 'propietario' = 'contacto'
): Promise<void> => {
  await api.patch(`/contactos/${id}/estado`, { 
    nuevoEstado, 
    propiedadId, 
    precioCierre, 
    nuevoEstadoPropiedad,
    tipo
  });
};
