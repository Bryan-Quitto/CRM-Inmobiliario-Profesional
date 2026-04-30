import { useSWRConfig } from 'swr';
import { usePropiedadesData } from './usePropiedadesList/usePropiedadesData';
import { usePropiedadesFiltering } from './usePropiedadesList/usePropiedadesFiltering';
import { usePropiedadesUI } from './usePropiedadesList/usePropiedadesUI';
import { usePropiedadesActions } from './usePropiedadesList/usePropiedadesActions';

export const usePropiedadesList = () => {
  const { mutate: globalMutate } = useSWRConfig();
  
  // 1. Data Layer
  const { 
    propiedades, 
    stats, 
    isLoading, 
    syncing, 
    mutate, 
    handleCoverUpdate 
  } = usePropiedadesData();

  // 2. UI & Navigation Layer
  const ui = usePropiedadesUI();

  // 3. Filtering Layer
  const {
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    filteredPropiedades
  } = usePropiedadesFiltering(propiedades);

  // 4. Actions Layer
  const {
    updatingId,
    handleStatusChange,
    handleRelistPropiedad,
    handleClosingConfirm: handleClosingConfirmBase
  } = usePropiedadesActions({
    propiedades,
    mutate,
    globalMutate,
    setOpenDropdownId: ui.setOpenDropdownId,
    setClosingPropiedad: ui.setClosingPropiedad,
    setShowReversionModal: ui.setShowReversionModal,
    setStatusConfirmation: ui.setStatusConfirmation
  });

  // Wrapper for handleClosingConfirm to match original signature
  const handleClosingConfirm = (precioCierre: number, cerradoConId: string, tipoCierre: string) => 
    handleClosingConfirmBase(precioCierre, cerradoConId, tipoCierre, ui.closingPropiedad);

  return {
    // Data
    propiedades,
    filteredPropiedades,
    stats,
    loading: isLoading,
    syncing,
    mutate,
    handleCoverUpdate,

    // Filtering
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,

    // UI State
    ...ui,

    // Actions
    updatingId,
    handleStatusChange,
    handleClosingConfirm,
    handleRelistPropiedad
  };
};
