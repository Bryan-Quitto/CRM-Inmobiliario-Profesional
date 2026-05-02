import { useNavigate } from 'react-router-dom';
import { SWRConfig } from 'swr';
import { localStorageProvider } from '@/lib/swr';
import { useClientesList } from '../hooks/useClientesList';

// Sections
import { ClientesListStats } from './clientes-list-sections/ClientesListStats';
import { ClientesListFilters } from './clientes-list-sections/ClientesListFilters';
import { ClientesListContent } from './clientes-list-sections/ClientesListContent';
import { ClientesListModals } from './clientes-list-sections/ClientesListModals';
import { ClientesSkeletonList } from './clientes-list-sections/ClientesSkeletonList';
import { ClientesSyncIndicator } from './clientes-list-sections/ClientesSyncIndicator';

const ClientesContent = () => {
  const navigate = useNavigate();
  const {
    activeSegment,
    setActiveSegment,
    clientes,
    filteredClientes,
    isLoading,
    syncing,
    stats,
    searchQuery,
    setSearchQuery,
    filterEtapa,
    setFilterEtapa,
    viewMode,
    setViewMode,
    isModalOpen,
    setIsModalOpen,
    selectedClienteForEdit,
    setSelectedClienteForEdit,
    openDropdownId,
    setOpenDropdownId,
    dropdownRef,
    notification,
    setNotification,
    closingLead,
    setClosingLead,
    handleStageChange,
    handleClosingConfirm,
    mutate
  } = useClientesList();

  if (isLoading) {
    return <ClientesSkeletonList />;
  }

  const basePath = '/contactos';
  const isOwnersView = activeSegment === 'propietarios';

  return (
    <div className="bg-slate-50 min-h-screen relative font-sans antialiased space-y-6 pb-20">
      <ClientesSyncIndicator syncing={syncing} count={clientes.length} />

      <ClientesListFilters 
        activeSegment={activeSegment}
        setActiveSegment={setActiveSegment}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterEtapa={filterEtapa}
        setFilterEtapa={setFilterEtapa}
        viewMode={viewMode}
        setViewMode={setViewMode}
        isFilterOpen={openDropdownId === 'filter'}
        setIsFilterOpen={(open) => setOpenDropdownId(open ? 'filter' : null)}
        onOpenCreateModal={() => setIsModalOpen(true)}
        dropdownRef={dropdownRef}
      />

      <ClientesListStats 
        total={stats.total} 
        nuevos={stats.nuevos} 
        negociacion={stats.negociacion} 
      />

      <ClientesListContent 
        filteredClientes={filteredClientes}
        viewMode={viewMode}
        syncing={syncing}
        onNavigate={(id) => navigate(`${basePath}/${id}`)}
        onEdit={setSelectedClienteForEdit}
        onStageChange={handleStageChange}
        openDropdownId={openDropdownId}
        setOpenDropdownId={setOpenDropdownId}
        dropdownRef={dropdownRef}
      />

      <ClientesListModals 
        isCreateModalOpen={isModalOpen}
        setIsCreateModalOpen={setIsModalOpen}
        isOwnersView={isOwnersView}
        selectedClienteForEdit={selectedClienteForEdit}
        setSelectedClienteForEdit={setSelectedClienteForEdit}
        closingLead={closingLead}
        setClosingLead={setClosingLead}
        onClosingConfirm={handleClosingConfirm}
        notification={notification}
        setNotification={setNotification}
        mutate={mutate}
      />
    </div>
  );
};

export const ClientesList = () => {
  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <ClientesContent />
    </SWRConfig>
  );
};
