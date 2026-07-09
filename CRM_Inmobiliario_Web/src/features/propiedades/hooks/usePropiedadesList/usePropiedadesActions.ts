import { useState } from 'react';
import type { KeyedMutator } from 'swr';
import { usePropertyCommercialLogic } from '../usePropertyCommercialLogic';
import type { Propiedad } from '../../types';
import type { PaginatedResponse } from './usePropiedadesData';

interface UsePropiedadesActionsProps {
  propiedades: Propiedad[];
  mutate: KeyedMutator<PaginatedResponse<Propiedad>>;
  setOpenDropdownId: (id: string | null) => void;
  setClosingPropiedad: (val: { propiedad: Propiedad; nuevoEstado: string } | null) => void;
  setShowReversionModal: (val: { type: 'status', id: string, targetStatus: string, currentStatus?: string } | null) => void;
  setStatusConfirmation: (val: { id: string; nuevoEstado: string } | null) => void;
}

export const usePropiedadesActions = ({
  propiedades,
  mutate,
  setOpenDropdownId,
  setClosingPropiedad,
  setShowReversionModal,
  setStatusConfirmation
}: UsePropiedadesActionsProps) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const commercial = usePropertyCommercialLogic({
    mutateOptimistic: (nuevoEstado) => {
      if (updatingId) {
        mutate((currentData) => {
          if (!currentData) return currentData;
          return {
            ...currentData,
            items: currentData.items.map(p => p.id === updatingId ? { ...p, estadoComercial: nuevoEstado } : p)
          };
        }, false);
      }
    },
    revalidate: async () => {
      await mutate();
    },
    onSuccess: () => {
      setUpdatingId(null);
      setOpenDropdownId(null);
      setClosingPropiedad(null);
      setShowReversionModal(null);
      setStatusConfirmation(null);
    },
    onError: () => {
      setUpdatingId(null);
    }
  });

  const handleStatusChange = async (id: string, nuevoEstado: string, confirmed = false) => {
    const propiedad = propiedades.find(p => p.id === id);
    if (!propiedad) return;

    setOpenDropdownId(null);
    setUpdatingId(id);

    commercial.handleStatusChange(propiedad, nuevoEstado, confirmed, {
      onOpenClosingModal: (estado) => {
        setClosingPropiedad({ propiedad, nuevoEstado: estado });
        setUpdatingId(null);
      },
      onOpenReversionModal: (estado) => {
        setShowReversionModal({ type: 'status', id, targetStatus: estado, currentStatus: propiedad.estadoComercial });
        setUpdatingId(null);
      },
      onOpenConfirmationModal: (estado) => {
        setStatusConfirmation({ id, nuevoEstado: estado });
        setUpdatingId(null);
      }
    });
  };

  const handleClosingConfirm = async (precioCierre: number | null, montoReserva: number | null, cerradoConId: string, agenteCerradorId: string | undefined, tipoCierre: string, closingPropiedad: { propiedad: Propiedad; nuevoEstado: string } | null) => {
    if (!closingPropiedad) return;
    const { propiedad } = closingPropiedad;
    
    setUpdatingId(propiedad.id);
    setClosingPropiedad(null);

    // Custom optimistic for list
    mutate((currentData) => {
      if (!currentData) return currentData;
      return {
        ...currentData,
        items: currentData.items.map(p => p.id === propiedad.id ? { ...p, estadoComercial: tipoCierre } : p)
      };
    }, false);

    await commercial.handleClosingConfirm(propiedad, precioCierre, montoReserva, cerradoConId, agenteCerradorId, tipoCierre);
  };

  const handleRelistPropiedad = async (id: string, _reason: string, type: 'Relist' | 'Cancel') => {
    const propiedad = propiedades.find(p => p.id === id);
    if (!propiedad) return;

    setUpdatingId(id);
    
    // Custom optimistic for list
    mutate((currentData) => {
      if (!currentData) return currentData;
      return {
        ...currentData,
        items: currentData.items.map(p => p.id === id ? { ...p, estadoComercial: 'Disponible' } : p)
      };
    }, false);

    await commercial.handleRelist(propiedad, type, 'Disponible');
  };

  return {
    updatingId: commercial.isProcessing ? updatingId : null,
    handleStatusChange,
    handleClosingConfirm,
    handleRelistPropiedad
  };
};
