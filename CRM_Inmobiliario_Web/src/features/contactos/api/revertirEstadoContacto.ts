import { api } from '@/lib/axios';

export const revertirEstadoContacto = async (id: string, nuevaEtapa: string, liberarPropiedades: boolean, notas?: string) => {
  const response = await api.post(`/contactos/${id}/revert-status`, { 
    nuevaEtapa, 
    liberarPropiedades, 
    notas 
  });
  return response.data;
};
