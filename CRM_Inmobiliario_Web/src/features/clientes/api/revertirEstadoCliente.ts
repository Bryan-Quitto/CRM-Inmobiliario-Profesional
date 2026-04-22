import axios from '@/lib/axios';

export const revertirEstadoCliente = async (id: string, nuevaEtapa: string, liberarPropiedades: boolean, notas?: string) => {
  const response = await axios.post(`/leads/${id}/revert-status`, { 
    nuevaEtapa, 
    liberarPropiedades, 
    notas 
  });
  return response.data;
};
