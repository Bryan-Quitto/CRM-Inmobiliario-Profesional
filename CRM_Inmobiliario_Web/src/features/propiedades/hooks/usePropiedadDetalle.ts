import { useState } from 'react';
import { usePropiedadData } from './usePropiedadData';
import { usePropiedadGallery } from './usePropiedadGallery';
import { usePropiedadComercial } from './usePropiedadComercial';
import { usePropiedadHistory } from './usePropiedadHistory';

interface UsePropiedadDetalleProps {
  id: string;
  onCoverUpdated?: (newUrl: string) => void;
}

export const usePropiedadDetalle = ({ id, onCoverUpdated }: UsePropiedadDetalleProps) => {
  // 1. Data Layer
  const { propiedad, historial, syncing, mutate, mutateHistorial } = usePropiedadData({ id });

  // 2. Commercial Layer (Status transitions, transitions Spec 011)
  const comercial = usePropiedadComercial({ propiedad, mutate, mutateHistorial });

  // 3. Gallery Layer (Media, Sections, Reordering)
  const gallery = usePropiedadGallery({ id, propiedad, mutate, onCoverUpdated });

  // 4. History Layer (Transactions, Notes)
  const history = usePropiedadHistory({ 
    historial, 
    mutate, 
    mutateHistorial, 
    setShowReversionModal: comercial.setShowReversionModal 
  });

  // 5. Shared / General UI States
  const [showEditModal, setShowEditModal] = useState(false);

  return {
    // Data
    propiedad,
    historial,
    syncing,
    mutate,
    mutateHistorial,

    // Commercial
    ...comercial,

    // Gallery
    ...gallery,

    // History
    ...history,

    // Shared UI
    showEditModal,
    setShowEditModal
  };
};
