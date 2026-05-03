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
    filterEtapa,
    setFilterEtapa,
    viewMode,
    setViewMode,
    isModalOpen,
    setIsModalOpen,
    selectedContactoForEdit,
    setSelectedContactoForEdit,
    notification,
    setNotification,
    closingContacto,
    setClosingContacto,
    handleStageChange,
    handleClosingConfirm,
    mutate
  } = useContactosList();

  if (isLoading) {
    return <ContactosSkeletonList />;
  }

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
        filterEtapa={filterEtapa}
        setFilterEtapa={setFilterEtapa}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenCreateModal={() => setIsModalOpen(true)}
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
        notification={notification}
        setNotification={setNotification}
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
