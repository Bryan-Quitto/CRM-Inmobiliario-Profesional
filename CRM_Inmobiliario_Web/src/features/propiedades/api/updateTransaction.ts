import { api } from '@/lib/axios';

export interface UpdateTransactionRequest {
  transactionDate: string;
  amount?: number | null;
  leadId?: string | null;
  notes?: string | null;
}

export const updateTransaction = async (id: string, data: UpdateTransactionRequest): Promise<void> => {
  await api.put(`/transactions/${id}`, data);
};
