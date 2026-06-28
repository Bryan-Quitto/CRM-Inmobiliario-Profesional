import { Loader2, Home } from 'lucide-react';
import { usePropiedadesListLogic } from '../hooks/usePropiedadesListLogic';

import { PropiedadesStatsHeader } from './propiedades-list-sections/PropiedadesStatsHeader';
import { PropiedadesFilters } from './propiedades-list-sections/PropiedadesFilters';
import { PropiedadesSkeletonList } from './propiedades-list-sections/PropiedadesSkeletonList';
import { PropiedadCardMobile } from './propiedades-list-sections/PropiedadCardMobile';


interface Props {
  logic: ReturnType<typeof usePropiedadesListLogic>;
}

export const PropiedadesListMobile = ({ logic }: Props) => {
  const {
    propiedades,
    filteredPropiedades,
    paginatedPropiedades,
    stats,
    loading,
    syncing,
    searchQuery,
    setSearchQuery,
    filterEstado,
    setFilterEstado,
    filterTipo,
    setFilterTipo,
    isArchived,
    setIsArchived,
    advancedFilters,
    setAdvancedFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    currentPage,
    setCurrentPage,
    totalPages,
    setIsModalOpen,
    updatingId,
    openDropdownId,
    setOpenDropdownId,
    setSelectedPropiedadIdForEdit,
    handleOpenDetail,
    handleStatusChange,
    dropdownRef
  } = logic;

  return (
    <div className="bg-slate-50 min-h-screen w-full font-sans antialiased relative pb-24 block lg:hidden">
      {/* Indicador de Sincronización UPSP */}
      {syncing && propiedades.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 duration-300 max-w-[90%]">
          <div className="bg-slate-900/90 backdrop-blur-xl text-white px-2 py-2 rounded-full shadow-2xl flex items-center gap-2 border border-white/10 w-full min-w-0">
            <Loader2 className="h-3 w-3 animate-spin text-blue-400 shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] truncate">Sincronizando...</span>
          </div>
        </div>
      )}

      <PropiedadesFilters 
        propiedades={propiedades}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterEstado={filterEstado}
        setFilterEstado={setFilterEstado}
        filterTipo={filterTipo}
        setFilterTipo={setFilterTipo}
        isArchived={isArchived}
        setIsArchived={setIsArchived}
        advancedFilters={advancedFilters}
        setAdvancedFilters={setAdvancedFilters}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortDirection={sortDirection}
        setSortDirection={setSortDirection}
        openDropdownId={openDropdownId}
        setOpenDropdownId={setOpenDropdownId}
        setIsModalOpen={setIsModalOpen}
        dropdownRef={dropdownRef}
      />

      <PropiedadesStatsHeader 
        total={stats.total} 
        venta={stats.venta} 
        alquiler={stats.alquiler} 
      />

      {loading ? (
        <PropiedadesSkeletonList />
      ) : filteredPropiedades.length === 0 ? (
        <div className="w-full px-2">
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-3 w-full text-center shadow-sm flex flex-col items-center">
            <div className="h-12 w-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 shrink-0">
              <Home className="h-8 w-8 text-slate-200 shrink-0" />
            </div>
            <p className="text-sm md:text-lg font-bold text-slate-900 break-words min-w-0 w-full">Sin resultados</p>
            <p className="text-slate-400 text-xs mt-1 w-full mx-auto break-words min-w-0">
              No encontramos lo que buscas. Intenta con otros filtros.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col w-full gap-2 px-2 animate-in fade-in duration-500">
          {paginatedPropiedades.map((p) => (
            <PropiedadCardMobile 
              key={p.id}
              propiedad={p}
              syncing={syncing}
              updatingId={updatingId}
              openDropdownId={openDropdownId}
              setOpenDropdownId={setOpenDropdownId}
              handleOpenDetail={handleOpenDetail}
              handleStatusChange={handleStatusChange}
              setSelectedPropiedadIdForEdit={setSelectedPropiedadIdForEdit}
              dropdownRef={dropdownRef}
            />
          ))}
        </div>
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
          <div className="mt-6 flex flex-row items-center justify-between gap-1 px-2 pb-6 w-full">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all shrink-0 ${currentPage === 1 ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 border border-slate-200 shadow-sm active:bg-slate-50'}`}
            >
              Anterior
            </button>
            
            <div className="flex items-center gap-1 overflow-x-auto justify-center min-w-0">
              {visiblePages[0] > 1 && <span className="text-slate-400 text-xs shrink-0">...</span>}
              {visiblePages.map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 shrink-0 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${currentPage === page ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 active:bg-slate-50'}`}
                >
                  {page}
                </button>
              ))}
              {visiblePages[visiblePages.length - 1] < totalPages && <span className="text-slate-400 text-xs shrink-0">...</span>}
            </div>

            <button 
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition-all shrink-0 ${currentPage === totalPages ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 border border-slate-200 shadow-sm active:bg-slate-50'}`}
            >
              Siguiente
            </button>
          </div>
        );
      })()}


    </div>
  );
};
