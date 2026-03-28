import { api } from '@/lib/axios';

export const actualizarEtapaCliente = async (id: string, nuevaEtapa: string): Promise<void> => {
  await api.patch(`/clientes/${id}/etapa`, { nuevaEtapa });
};
