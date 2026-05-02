import { useState } from 'react';
import { toast } from 'sonner';
import type { KeyedMutator } from 'swr';
import { deleteTransaction } from '../api/deleteTransaction';
import { updateTransaction } from '../api/updateTransaction';
import type { PropertyTransactionResponse } from '../api/getHistorialPropiedad';
import type { Propiedad } from '../types';

interface UsePropiedadHistoryProps {
  historial?: PropertyTransactionResponse[];
  mutate: KeyedMutator<Propiedad>;
  mutateHistorial: KeyedMutator<PropertyTransactionResponse[]>;
  setShowReversionModal: (val: { type: 'transaction' | 'status', id?: string, targetStatus?: string } | null) => void;
}

export const usePropiedadHistory = ({ historial, mutate, mutateHistorial, setShowReversionModal }: UsePropiedadHistoryProps) => {
  const [transactionMenuOpen, setTransactionMenuOpen] = useState<string | null>(null);

  const handleDeleteTransaction = async (transactionId: string) => {
    if (!historial) return;
    const transaction = historial.find(t => t.id === transactionId);

    if (transaction && (transaction.transactionType === 'Sale' || transaction.transactionType === 'Rent')) {
      setShowReversionModal({ type: 'transaction', id: transactionId });
      setTransactionMenuOpen(null);
      return;
    }

    let isCancelled = false;
    const previousHistorial = [...historial];

    const commitDelete = async () => {
      if (isCancelled) return;
      try {
        await deleteTransaction(transactionId);
        mutate();
        mutateHistorial();
      } catch {
        toast.error("Error al eliminar del historial");
        mutateHistorial(previousHistorial, false);
      }
    };

    toast.warning("Registro eliminado", {
      description: "Tienes 5 segundos para deshacer.",
      action: {
        label: "Deshacer",
        onClick: () => {
          isCancelled = true;
          mutateHistorial(previousHistorial, false);
          toast.success("Acción cancelada");
        }
      },
      duration: 5000,
      onAutoClose: commitDelete,
      onDismiss: commitDelete
    });

    mutateHistorial(historial.filter(t => t.id !== transactionId), false);
    setTransactionMenuOpen(null);
  };

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
    transactionMenuOpen,
    setTransactionMenuOpen,
    handleDeleteTransaction,
    handleInlineUpdateNote
  };
};
