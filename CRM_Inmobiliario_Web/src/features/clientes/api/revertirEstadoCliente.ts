import { api } from '@/lib/axios';

export const revertirEstadoCliente = async (id: string, nuevaEtapa: string, liberarPropiedades: boolean, notas?: string) => {
  const response = await api.post(`/leads/${id}/revert-status`, { 
    nuevaEtapa, 
    liberarPropiedades, 
    notas 
  });
  return response.data;
};
