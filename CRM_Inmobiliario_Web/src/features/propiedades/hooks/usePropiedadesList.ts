import { usePropiedadesData } from './usePropiedadesList/usePropiedadesData';
import { usePropiedadesFiltering } from './usePropiedadesList/usePropiedadesFiltering';
import { usePropiedadesUI } from './usePropiedadesList/usePropiedadesUI';
import { usePropiedadesActions } from './usePropiedadesList/usePropiedadesActions';

export const usePropiedadesList = (checkContactoId?: string) => {
  // 1. Filtering Layer
  const {
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    filterTipo,
    setFilterTipo,
    advancedFilters,
    setAdvancedFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    queryParams
  } = usePropiedadesFiltering();

  // 2. Data Layer
  const { 
    propiedades, 
    totalCount,
    stats, 
    isLoading, 
    syncing, 
    mutate, 
    handleCoverUpdate 
  } = usePropiedadesData(queryParams, checkContactoId);

  // Calculate pagination
  const itemsPerPage = 50;
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // 3. UI & Navigation Layer
  const ui = usePropiedadesUI();

  // 4. Actions Layer
  const {
    updatingId,
    handleStatusChange,
    handleRelistPropiedad,
    handleClosingConfirm: handleClosingConfirmBase
  } = usePropiedadesActions({
    propiedades,
    mutate,
    setOpenDropdownId: ui.setOpenDropdownId,
    setClosingPropiedad: ui.setClosingPropiedad,
    setShowReversionModal: ui.setShowReversionModal,
    setStatusConfirmation: ui.setStatusConfirmation
  });

  // Wrapper for handleClosingConfirm to match original signature
  const handleClosingConfirm = (precioCierre: number | null, cerradoConId: string, agenteCerradorId: string | undefined, tipoCierre: string) => 
    handleClosingConfirmBase(precioCierre, cerradoConId, agenteCerradorId, tipoCierre, ui.closingPropiedad);

  return {
    // Data
    propiedades,
    filteredPropiedades: propiedades, // All filtering is done on server now
    paginatedPropiedades: propiedades, // Already paginated from server
    stats,
    loading: isLoading,
    syncing,
    mutate,
    handleCoverUpdate,

    // Filtering & Sorting
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    filterTipo,
    setFilterTipo,
    advancedFilters,
    setAdvancedFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    totalPages,

    // UI State
    ...ui,

    // Actions
    updatingId,
    handleStatusChange,
    handleClosingConfirm,
    handleRelistPropiedad
  };
};
