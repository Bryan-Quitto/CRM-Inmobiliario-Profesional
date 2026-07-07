import React from 'react';
import { ContactosListStats } from './contactos-list-sections/ContactosListStats';
import { ContactosListFilters } from './contactos-list-sections/ContactosListFilters';
import { ContactosListContent } from './contactos-list-sections/ContactosListContent';
import { ContactosListModals } from './contactos-list-sections/ContactosListModals';
import { ContactosSkeletonList } from './contactos-list-sections/ContactosSkeletonList';
import { ContactosSyncIndicator } from './contactos-list-sections/ContactosSyncIndicator';
import { AdvancedFiltersDrawer } from './contactos-list-sections/AdvancedFiltersDrawer';
import type { ContactosListLogic } from '../hooks/useContactosListLogic';

interface ContactosListDesktopProps {
  logic: ContactosListLogic;
}

export const ContactosListDesktop: React.FC<ContactosListDesktopProps> = ({ logic }) => {
  return (
    <div className="bg-slate-50 min-h-screen relative font-sans antialiased space-y-6 pb-20">
      <ContactosSyncIndicator syncing={logic.syncing} count={logic.contactos.length} />

      <ContactosListFilters 
        activeSegment={logic.activeSegment}
        setActiveSegment={logic.setActiveSegment}
        searchQuery={logic.searchQuery}
        setSearchQuery={logic.setSearchQuery}
        filterVisibilidad={logic.filterVisibilidad}
        setFilterVisibilidad={logic.setFilterVisibilidad}
        filterOrigen={logic.filterOrigen}
        setFilterOrigen={logic.setFilterOrigen}
        filterEstadoCliente={logic.filterEstadoCliente}
        setFilterEstadoCliente={logic.setFilterEstadoCliente}
        filterEstadoPropietario={logic.filterEstadoPropietario}
        setFilterEstadoPropietario={logic.setFilterEstadoPropietario}
        filterEstadoIA_WA={logic.filterEstadoIA_WA}
        setFilterEstadoIA_WA={logic.setFilterEstadoIA_WA}
        filterEstadoIA_FB={logic.filterEstadoIA_FB}
        setFilterEstadoIA_FB={logic.setFilterEstadoIA_FB}
        sortBy={logic.sortBy}
        setSortBy={logic.setSortBy}
        sortDirection={logic.sortDirection}
        setSortDirection={logic.setSortDirection}
        isArchived={logic.isArchived}
        setIsArchived={logic.setIsArchived}
        viewMode={logic.viewMode}
        setViewMode={logic.setViewMode}
        onOpenCreateModal={() => logic.handleOpenCreateModal('create', { isOwnersView: logic.isOwnersView })}
        onOpenAdvancedFilters={() => logic.setIsAdvancedFiltersOpen(true)}
        advancedFiltersCount={logic.activeAdvancedCount}
        clearAllFilters={logic.clearAllFilters}
      />

      <AdvancedFiltersDrawer
        contactos={logic.contactos}
        isOpen={logic.isAdvancedFiltersOpen}
        onClose={() => logic.setIsAdvancedFiltersOpen(false)}
        filters={logic.advancedFilters}
        setFilters={logic.setAdvancedFilters}
        activeCount={logic.activeAdvancedCount}
      />

      <ContactosListStats 
        total={logic.stats.total} 
        nuevos={logic.stats.nuevos} 
        negociacion={logic.stats.negociacion} 
      />

      {logic.isLoading ? (
        <div className="mt-6">
          <ContactosSkeletonList />
        </div>
      ) : (
        <ContactosListContent 
          filteredContactos={logic.paginatedContactos}
          activeSegment={logic.activeSegment}
          viewMode={logic.viewMode}
          syncing={logic.syncing}
          onEdit={(contacto) => logic.handleOpenCreateModal('edit', { contacto })}
          onStageChange={logic.handleStageChange}
        />
      )}

      {/* Pagination Controls */}
      {logic.totalPages > 1 && (
        <div className="mt-8 mb-4 flex justify-center items-center gap-2 sm:gap-4 flex-wrap">
          <button 
            onClick={() => logic.setCurrentPage(1)}
            disabled={logic.currentPage === 1}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${logic.currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed hidden sm:block' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hidden sm:block'}`}
          >
            Primera
          </button>

          <button 
            onClick={() => logic.setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={logic.currentPage === 1}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${logic.currentPage === 1 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
          >
            Anterior
          </button>
          
          <div className="flex items-center gap-1 sm:gap-2">
            {logic.visiblePages[0] > 1 && <span className="text-slate-400">...</span>}
            {logic.visiblePages.map(page => (
              <button
                key={page}
                onClick={() => logic.setCurrentPage(page)}
                className={`w-10 h-10 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center ${logic.currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
              >
                {page}
              </button>
            ))}
            {logic.visiblePages[logic.visiblePages.length - 1] < logic.totalPages && <span className="text-slate-400">...</span>}
          </div>

          <button 
            onClick={() => logic.setCurrentPage(prev => Math.min(logic.totalPages, prev + 1))}
            disabled={logic.currentPage === logic.totalPages}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${logic.currentPage === logic.totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm'}`}
          >
            Siguiente
          </button>

          <button 
            onClick={() => logic.setCurrentPage(logic.totalPages)}
            disabled={logic.currentPage === logic.totalPages}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${logic.currentPage === logic.totalPages ? 'bg-slate-100 text-slate-400 cursor-not-allowed hidden sm:block' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm hidden sm:block'}`}
          >
            Última
          </button>
        </div>
      )}

      {/* Floating Scroll Buttons */}
      <div className="fixed bottom-24 right-6 sm:right-8 hidden md:flex flex-col gap-2 z-[90]">
        {logic.showScrollTop && (
          <button 
            title="Ir al inicio"
            onClick={logic.scrollToTop}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
        )}
        {logic.showScrollBottom && (
          <button 
            title="Ir al final"
            onClick={logic.scrollToBottom}
            className="w-10 h-10 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-full shadow-lg flex items-center justify-center transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        )}
      </div>

      <ContactosListModals 
        newCycleConfirmation={logic.newCycleConfirmation}
        setNewCycleConfirmation={logic.setNewCycleConfirmation}
        executeStageChange={logic.executeStageChange}
      />
    </div>
  );
};
