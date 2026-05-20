import { useNavigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { localStorageProvider } from '@/lib/swr';
import { useContactosList } from '../hooks/useContactosList';

// Sections
import { ContactosListStats } from './contactos-list-sections/ContactosListStats';
import { ContactosListFilters } from './contactos-list-sections/ContactosListFilters';
import { ContactosListContent } from './contactos-list-sections/ContactosListContent';
import { ContactosListModals } from './contactos-list-sections/ContactosListModals';
import { ContactosSkeletonList } from './contactos-list-sections/ContactosSkeletonList';
import { ContactosSyncIndicator } from './contactos-list-sections/ContactosSyncIndicator';
import { AdvancedFiltersDrawer } from './contactos-list-sections/AdvancedFiltersDrawer';
import { useState } from 'react';

const ContactosContent = () => {
  const navigate = useNavigate();
  const {
    activeSegment,
    setActiveSegment,
    contactos,
    filteredContactos,
    isLoading,
    syncing,
    stats,
    searchQuery,
    setSearchQuery,
    filterVisibilidad,
    setFilterVisibilidad,
    filterOrigen,
    setFilterOrigen,
    filterEstadoCliente,
    setFilterEstadoCliente,
    filterEstadoPropietario,
    setFilterEstadoPropietario,
    advancedFilters,
    setAdvancedFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    viewMode,
    setViewMode,
    isModalOpen,
    setIsModalOpen,
    selectedContactoForEdit,
    setSelectedContactoForEdit,
    closingContacto,
    setClosingContacto,
    handleStageChange,
    handleClosingConfirm,
    mutate
  } = useContactosList();

  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  if (isLoading) {
    return <ContactosSkeletonList />;
  }

  const activeAdvancedCount = Object.values(advancedFilters).filter(v => v !== undefined && v !== '').length;

  const basePath = '/contactos';
  const isOwnersView = activeSegment === 'propietarios';

  return (
    <div className="bg-slate-50 min-h-screen relative font-sans antialiased space-y-6 pb-20">
      <ContactosSyncIndicator syncing={syncing} count={contactos.length} />

      <ContactosListFilters 
        activeSegment={activeSegment}
        setActiveSegment={setActiveSegment}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterVisibilidad={filterVisibilidad}
        setFilterVisibilidad={setFilterVisibilidad}
        filterOrigen={filterOrigen}
        setFilterOrigen={setFilterOrigen}
        filterEstadoCliente={filterEstadoCliente}
        setFilterEstadoCliente={setFilterEstadoCliente}
        filterEstadoPropietario={filterEstadoPropietario}
        setFilterEstadoPropietario={setFilterEstadoPropietario}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenCreateModal={() => setIsModalOpen(true)}
        onOpenAdvancedFilters={() => setIsAdvancedFiltersOpen(true)}
        advancedFiltersCount={activeAdvancedCount}
      />

      <AdvancedFiltersDrawer
        contactos={contactos}
        isOpen={isAdvancedFiltersOpen}
        onClose={() => setIsAdvancedFiltersOpen(false)}
        filters={advancedFilters}
        setFilters={setAdvancedFilters}
        activeCount={activeAdvancedCount}
      />

      <ContactosListStats 
        total={stats.total} 
        nuevos={stats.nuevos} 
        negociacion={stats.negociacion} 
      />

      <ContactosListContent 
        filteredContactos={filteredContactos}
        activeSegment={activeSegment}
        viewMode={viewMode}
        syncing={syncing}
        onNavigate={(id) => navigate(`${basePath}/${id}`)}
        onEdit={setSelectedContactoForEdit}
        onStageChange={handleStageChange}
      />

      <ContactosListModals 
        isCreateModalOpen={isModalOpen}
        setIsCreateModalOpen={setIsModalOpen}
        isOwnersView={isOwnersView}
        selectedContactoForEdit={selectedContactoForEdit}
        setSelectedContactoForEdit={setSelectedContactoForEdit}
        closingContacto={closingContacto}
        setClosingContacto={setClosingContacto}
        onClosingConfirm={handleClosingConfirm}
        mutate={mutate}
      />
    </div>
  );
};

export const ContactosList = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <ContactosContent />
    </SWRConfig>
  );
};
