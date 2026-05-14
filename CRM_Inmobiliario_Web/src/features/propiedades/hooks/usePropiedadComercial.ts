import { useState } from 'react';
import type { KeyedMutator } from 'swr';
import { usePropertyCommercialLogic } from './usePropertyCommercialLogic';
import type { Propiedad } from '../types';
import type { PropertyTransactionResponse } from '../api/getHistorialPropiedad';

interface UsePropiedadComercialProps {
  propiedad?: Propiedad;
  mutate: KeyedMutator<Propiedad>;
  mutateHistorial: KeyedMutator<PropertyTransactionResponse[]>;
}

export const usePropiedadComercial = ({ propiedad, mutate, mutateHistorial }: UsePropiedadComercialProps) => {
  const [statusConfirmation, setStatusConfirmation] = useState<string | null>(null);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingState, setClosingState] = useState<string | undefined>(undefined);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [showReversionModal, setShowReversionModal] = useState<{ type: 'transaction' | 'status', id?: string, targetStatus?: string } | null>(null);

  const commercial = usePropertyCommercialLogic({
    mutateOptimistic: (nuevoEstado) => {
      if (propiedad) mutate({ ...propiedad, estadoComercial: nuevoEstado }, false);
    },
    revalidate: async () => {
      await mutate();
      await mutateHistorial();
    },
    onSuccess: () => {
      setIsClosingModalOpen(false);
      setStatusConfirmation(null);
      setShowReversionModal(null);
    }
  });

  const handleClosingConfirm = async (precioCierre: number, cerradoConId: string, finalStatus: string) => {
    if (!propiedad) return;
    await commercial.handleClosingConfirm(propiedad, precioCierre, cerradoConId, finalStatus);
  };

  const handleStatusChange = (nuevoEstado: string, confirmed = false) => {
    if (!propiedad) return;
    setIsStatusDropdownOpen(false);

    commercial.handleStatusChange(propiedad, nuevoEstado, confirmed, {
      onOpenClosingModal: (estado) => {
        setClosingState(estado);
        setIsClosingModalOpen(true);
      },
      onOpenReversionModal: (estado) => {
        setShowReversionModal({ type: 'status', targetStatus: estado });
      },
      onOpenConfirmationModal: (estado) => {
        setStatusConfirmation(estado);
      }
    });
  };

  const handleRelist = async (targetStatus?: string) => {
    if (!propiedad) return;
    setShowReversionModal(null);
    await commercial.handleRelist(propiedad, 'Relist', targetStatus);
  };

  const handleCancelTransaction = async (targetStatus?: string) => {
    if (!propiedad) return;
    setShowReversionModal(null);
    await commercial.handleRelist(propiedad, 'Cancel', targetStatus);
  };

  return {
    isUpdatingStatus: commercial.isProcessing,
    statusConfirmation,
    isClosingModalOpen,
    closingState,
    isStatusDropdownOpen,
    showReversionModal,
    setStatusConfirmation,
    setIsClosingModalOpen,
    setClosingState,
    setIsStatusDropdownOpen,
    setShowReversionModal,
    handleClosingConfirm,
    handleStatusChange,
    handleRelist,
    handleCancelTransaction
  };
};
