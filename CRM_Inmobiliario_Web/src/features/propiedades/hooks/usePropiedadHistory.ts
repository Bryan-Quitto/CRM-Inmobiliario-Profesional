import { toast } from 'sonner';
import type { KeyedMutator } from 'swr';
import { updateTransaction } from '../api/updateTransaction';
import type { PropertyTransactionResponse } from '../api/getHistorialPropiedad';
import type { Propiedad } from '../types';

interface UsePropiedadHistoryProps {
  mutate: KeyedMutator<Propiedad>;
  mutateHistorial: KeyedMutator<PropertyTransactionResponse[]>;
}

export const usePropiedadHistory = ({ mutate, mutateHistorial }: UsePropiedadHistoryProps) => {
  const handleInlineUpdateNote = async (transaction: PropertyTransactionResponse, newNotes: string) => {
    try {
      await updateTransaction(transaction.id, {
        transactionDate: transaction.transactionDate,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        contactoId: transaction.contactoId,
        notes: newNotes
      });
      mutate();
      mutateHistorial();
      toast.success("Nota actualizada");
    } catch {
      toast.error("Error al actualizar la nota");
    }
  };

  return {
    handleInlineUpdateNote
  };
};
