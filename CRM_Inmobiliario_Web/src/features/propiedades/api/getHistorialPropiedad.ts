import { api } from '@/lib/axios';

export interface PropertyTransactionResponse {
  id: string;
  transactionType: 'Sale' | 'Rent' | 'Cancellation' | 'Relisting';
  transactionStatus: 'Active' | 'Completed' | 'Cancelled';
  amount?: number;
  transactionDate: string;
  notes?: string;
  agenteNombre: string;
  leadId?: string;
  leadNombre?: string;
}

export const getHistorialPropiedad = async (id: string): Promise<PropertyTransactionResponse[]> => {
  const response = await api.get(`/propiedades/${id}/history`);
  return response.data;
};
