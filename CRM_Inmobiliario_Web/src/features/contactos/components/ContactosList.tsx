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
    paginatedContactos,
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
    currentPage,
    setCurrentPage,
    totalPages,
    viewMode,
    setViewMode,
    isOwnersView,
    newCycleConfirmation,
    setNewCycleConfirmation,
    handleStageChange,
    executeStageChange
  } = useContactosList();

  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  const activeAdvancedCount = Object.values(advancedFilters).filter(v => v !== undefined && v !== '').length;

  const basePath = '/contactos';

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
        onOpenCreateModal={() => window.dispatchEvent(new CustomEvent('open-crear-contacto-modal', { detail: { action: 'create', isOwnersView } }))}
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

      {isLoading ? (
        <div className="mt-6">
          <ContactosSkeletonList />
        </div>
      ) : (
        <ContactosListContent 
          filteredContactos={paginatedContactos}
          activeSegment={activeSegment}
          viewMode={viewMode}
          syncing={syncing}
          onNavigate={(id) => navigate(`${basePath}/${id}`)}
          onEdit={(contacto) => window.dispatchEvent(new CustomEvent('open-crear-contacto-modal', { detail: { action: 'edit', contacto } }))}
          onStageChange={handleStageChange}
        />
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (() => {
        const getVisiblePages = (current: number, total: number) => {
          if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
          if (current <= 3) return [1, 2, 3, 4, 5];
          if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
          return [current - 2, current - 1, current, current + 1, current + 2];
        };
        const visiblePages = getVisiblePages(currentPage, totalPages);

        return (
          <div className="mt-8 mb-4 flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
            <button 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed hidden sm:block' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hidden sm:block'}`}
            >
              Primera
            </button>

            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {visiblePages[0] > 1 && <span className="text-slate-400">...</span>}
              {visiblePages.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                  {page}
                </button>
              ))}
              {visiblePages[visiblePages.length - 1] < totalPages && <span className="text-slate-400">...</span>}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
            >
              Siguiente
            </button>

            <button 
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentPage === totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed hidden sm:block' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hidden sm:block'}`}
            >
              Última
            </button>
          </div>
        );
      })()}

      {/* Floating Scroll Buttons */}
      <div className="fixed bottom-24 right-6 sm:right-8 flex flex-col gap-2 z-[90]">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer"
          title="Ir al inicio"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
        <button 
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          className="w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer"
          title="Ir al final"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>

      <ContactosListModals 
        newCycleConfirmation={newCycleConfirmation}
        setNewCycleConfirmation={setNewCycleConfirmation}
        executeStageChange={executeStageChange}
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
