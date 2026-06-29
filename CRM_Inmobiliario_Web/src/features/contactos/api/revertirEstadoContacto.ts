import { api } from '@/lib/axios';

export const revertirEstadoContacto = async (id: string, nuevoEstado: string, liberarPropiedades: boolean, notas?: string) => {
  const response = await api.post(`/contactos/${id}/revert-status`, { 
    nuevoEstado, 
    liberarPropiedades, 
    notas 
  });
  return response.data;
};
