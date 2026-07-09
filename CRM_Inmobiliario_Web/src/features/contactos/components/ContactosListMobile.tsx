import React from 'react';
import { ContactosListStats } from './contactos-list-sections/ContactosListStats';
import { ContactosListContent } from './contactos-list-sections/ContactosListContent';
import { ContactosListModals } from './contactos-list-sections/ContactosListModals';
import { ContactosSkeletonList } from './contactos-list-sections/ContactosSkeletonList';
import { ContactosSyncIndicator } from './contactos-list-sections/ContactosSyncIndicator';
import { AdvancedFiltersDrawer } from './contactos-list-sections/AdvancedFiltersDrawer';
import { ContactosListMobileFilters } from './contactos-list-sections/ContactosListMobileFilters';
import type { ContactosListLogic } from '../hooks/useContactosListLogic';

interface ContactosListMobileProps {
  logic: ContactosListLogic;
}

export const ContactosListMobile: React.FC<ContactosListMobileProps> = ({ logic }) => {
  return (
    <div className="w-full bg-slate-50 min-h-screen relative font-sans antialiased space-y-2 p-2 pb-6 overflow-x-hidden min-w-0">
      <ContactosSyncIndicator syncing={logic.syncing} count={logic.contactos.length} />

      <ContactosListMobileFilters logic={logic} />

      <AdvancedFiltersDrawer
        contactos={logic.contactos}
        isOpen={logic.isAdvancedFiltersOpen}
        onClose={() => logic.setIsAdvancedFiltersOpen(false)}
        filters={logic.advancedFilters}
        setFilters={logic.setAdvancedFilters}
        activeCount={logic.activeAdvancedCount}
      />

      <div className="w-full overflow-x-auto pb-2 min-w-0">
        <ContactosListStats 
          total={logic.stats.total} 
          nuevos={logic.stats.nuevos} 
          negociacion={logic.stats.negociacion} 
        />
      </div>

      {logic.isLoading ? (
        <div className="w-full mt-4 min-w-0">
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

      {/* Pagination Controls Mobile */}
      {logic.totalPages > 1 && (
        <div className="w-full mt-6 mb-2 flex justify-center items-center gap-2 flex-wrap min-w-0">
          <button 
            onClick={() => logic.setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={logic.currentPage === 1}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${logic.currentPage === 1 ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 border border-slate-200'}`}
          >
            Ant
          </button>
          
          <div className="flex flex-wrap items-center justify-center gap-1 min-w-0">
            {logic.visiblePages.map(page => (
              <button
                key={page}
                onClick={() => logic.setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${logic.currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}
              >
                {page}
              </button>
            ))}
          </div>

          <button 
            onClick={() => logic.setCurrentPage(prev => Math.min(logic.totalPages, prev + 1))}
            disabled={logic.currentPage === logic.totalPages}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${logic.currentPage === logic.totalPages ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 border border-slate-200'}`}
          >
            Sig
          </button>
        </div>
      )}

      <ContactosListModals 
        newCycleConfirmation={logic.newCycleConfirmation}
        setNewCycleConfirmation={logic.setNewCycleConfirmation}
        executeStageChange={logic.executeStageChange}
        isMigrarModalOpen={logic.isMigrarModalOpen}
        setIsMigrarModalOpen={logic.setIsMigrarModalOpen}
        migrarRoles={logic.migrarRoles}
        setMigrarRoles={logic.setMigrarRoles}
        executeMigrar={logic.handleMigrarContactosTelefono}
      />
    </div>
  );
};
